"""
Position Cadron — Backend API (fichier unique)
=================================================
Application réduite à une seule chose : l'opérateur scanne (ou tape) le
matricule d'un outil, l'app renvoie sa hauteur cuivre et sa hauteur isolant.
Une seule table en base : `tools`. Pas de machines, pas d'admin, pas
d'alertes, pas de photo.

Lancement : inchangé, via `python run.py`.
"""

import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict
from pydantic_settings import BaseSettings
from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint, create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from sqlalchemy.sql import func


# =====================================================================
# 1. CONFIGURATION
# =====================================================================

class Settings(BaseSettings):
    DATABASE_URL: str
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    ADMIN_PASSWORD: str = "changeme"

    class Config:
        env_file = ".env"


settings = Settings()


# =====================================================================
# 2. BASE DE DONNÉES
# =====================================================================

engine = create_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_database_schema():
    """Upgrade the legacy tools table to the current schema.

    Older installations only had a unique matricule column. The current app
    expects a multi-section schema based on (matricule, section_fil), so we
    add the missing column when needed and normalize legacy values to plain
    section numbers before enforcing the composite unique key.
    """
    with engine.begin() as conn:
        columns = conn.execute(text("SHOW COLUMNS FROM tools LIKE 'section_fil'"))
        if columns.fetchone() is None:
            conn.execute(text("ALTER TABLE tools ADD COLUMN section_fil VARCHAR(50) NULL AFTER matricule"))

        indexes = conn.execute(text("SHOW INDEX FROM tools")).mappings().all()

        for index in indexes:
            if index["Non_unique"] == 0 and index["Column_name"] == "matricule":
                try:
                    conn.execute(text(f"ALTER TABLE tools DROP INDEX `{index['Key_name']}`"))
                except Exception:
                    pass

        try:
            conn.execute(text("ALTER TABLE tools DROP INDEX `uq_matricule_section_fil`"))
        except Exception:
            pass


ensure_database_schema()


# =====================================================================
# 3. MODÈLE (table unique : tools)
# =====================================================================

class Tool(Base):
    __tablename__ = "tools"
    __table_args__ = (
        UniqueConstraint("matricule", "section_fil", name="uq_matricule_section_fil"),
    )

    id = Column(Integer, primary_key=True, index=True)
    matricule = Column(String(20), nullable=False, index=True)
    section_fil = Column(String(50), nullable=True, default=None)
    hauteur_cuivre = Column(String(50), nullable=True)
    hauteur_isolant = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# =====================================================================
# 4. SCHÉMAS
# =====================================================================

class ToolBase(BaseModel):
    matricule: str
    section_fil: str | None = None
    hauteur_cuivre: str | None = None
    hauteur_isolant: str | None = None


class ToolCreate(ToolBase):
    pass


class ToolUpdate(BaseModel):
    matricule: str | None = None
    section_fil: str | None = None
    hauteur_cuivre: str | None = None
    hauteur_isolant: str | None = None


class ToolOut(ToolBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminLogin(BaseModel):
    password: str


# =====================================================================
# 5. APPLICATION FASTAPI + ROUTES
# =====================================================================

app = FastAPI(
    title="Position Cadron API",
    description="Consultation des outils (matricule → sections fil et leurs hauteurs)",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/tools/", response_model=list[ToolOut])
def list_tools(db: Session = Depends(get_db)):
    return db.query(Tool).all()


@app.get("/api/tools/{matricule}", response_model=list[ToolOut])
def get_tool_by_matricule(matricule: str, db: Session = Depends(get_db)):
    """Endpoint appelé après le scan : le frontend envoie le matricule lu.
    Un même matricule peut avoir plusieurs sections fil, chacune avec ses
    propres hauteurs — on renvoie donc toutes les lignes correspondantes."""
    tools = db.query(Tool).filter(Tool.matricule == matricule).all()
    if not tools:
        raise HTTPException(status_code=404, detail="Aucun outil trouvé avec ce matricule")
    return tools


@app.post("/api/tools/", response_model=ToolOut, status_code=status.HTTP_201_CREATED)
def create_tool(payload: ToolCreate, db: Session = Depends(get_db)):
    """Pas d'écran dédié dans l'app (interface opérateur = lecture seule),
    mais gardé pour peupler la base via l'API/un script."""
    normalized_section = payload.section_fil.strip() if payload.section_fil else None

    if normalized_section:
        exists = (
            db.query(Tool)
            .filter(Tool.matricule == payload.matricule, Tool.section_fil == normalized_section)
            .first()
        )
        if exists:
            raise HTTPException(status_code=400, detail="Cette section fil existe déjà pour ce matricule")

    tool = Tool(
        matricule=payload.matricule,
        section_fil=normalized_section,
        hauteur_cuivre=payload.hauteur_cuivre,
        hauteur_isolant=payload.hauteur_isolant,
    )
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool


@app.put("/api/tools/{tool_id}", response_model=ToolOut)
def update_tool(tool_id: int, payload: ToolUpdate, db: Session = Depends(get_db)):
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Outil introuvable")

    data = payload.model_dump(exclude_unset=True)

    new_matricule = data.get("matricule", tool.matricule)
    new_section_fil = data.get("section_fil", tool.section_fil)
    if "matricule" in data and data["matricule"] is not None:
        new_matricule = data["matricule"].strip()
        if not new_matricule:
            raise HTTPException(status_code=400, detail="Le matricule ne peut pas être vide")
        data["matricule"] = new_matricule

    if data.get("section_fil") is not None:
        normalized_section = data["section_fil"].strip()
        data["section_fil"] = normalized_section if normalized_section else None
        new_section_fil = data["section_fil"]

    if new_section_fil and (new_matricule, new_section_fil) != (tool.matricule, tool.section_fil):
        conflict = (
            db.query(Tool)
            .filter(Tool.matricule == new_matricule, Tool.section_fil == new_section_fil, Tool.id != tool_id)
            .first()
        )
        if conflict:
            raise HTTPException(status_code=400, detail="Cette section fil existe déjà pour ce matricule")

    for field, value in data.items():
        setattr(tool, field, value)

    db.commit()
    db.refresh(tool)
    return tool


@app.delete("/api/tools/{tool_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tool(tool_id: int, db: Session = Depends(get_db)):
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Outil introuvable")
    db.delete(tool)
    db.commit()


@app.post("/api/admin/login")
def admin_login(payload: AdminLogin):
    """Vérifie le mot de passe admin unique (pas de compte, pas de session persistée
    côté serveur — le frontend redemande ce mot de passe à chaque chargement de /admin)."""
    if payload.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")
    return {"ok": True}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# --- Sert l'interface React déjà compilée (frontend/dist)
# Build multi-page : index.html (opérateur) et admin.html (admin) sont deux
# bundles indépendants générés par Vite dans le même dossier dist/.
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="frontend-assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        # Accès à l'interface admin via /admin ou /admin.html
        if full_path in ("admin", "admin.html", "admin/"):
            return FileResponse(os.path.join(FRONTEND_DIST, "admin.html"))

        candidate = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "message": "Position Cadron API is running (frontend/dist introuvable — "
            "lance 'npm run build' dans frontend/ pour servir l'interface depuis ce port)"
        }
