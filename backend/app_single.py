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
from sqlalchemy import Column, DateTime, Integer, String, create_engine
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


# =====================================================================
# 3. MODÈLE (table unique : tools)
# =====================================================================

class Tool(Base):
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True, index=True)
    matricule = Column(String(20), unique=True, nullable=False, index=True)
    hauteur_cuivre = Column(String(50), nullable=True)
    hauteur_isolant = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# =====================================================================
# 4. SCHÉMAS
# =====================================================================

class ToolBase(BaseModel):
    matricule: str
    hauteur_cuivre: str | None = None
    hauteur_isolant: str | None = None


class ToolCreate(ToolBase):
    pass


class ToolUpdate(BaseModel):
    matricule: str | None = None
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
    description="Consultation des outils (matricule → hauteur cuivre / hauteur isolant)",
    version="2.0.0"
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


@app.get("/api/tools/{matricule}", response_model=ToolOut)
def get_tool_by_matricule(matricule: str, db: Session = Depends(get_db)):
    """Endpoint appelé après le scan : le frontend envoie le matricule lu."""
    tool = db.query(Tool).filter(Tool.matricule == matricule).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Aucun outil trouvé avec ce matricule")
    return tool


@app.post("/api/tools/", response_model=ToolOut, status_code=status.HTTP_201_CREATED)
def create_tool(payload: ToolCreate, db: Session = Depends(get_db)):
    """Pas d'écran dédié dans l'app (interface opérateur = lecture seule),
    mais gardé pour peupler la base via l'API/un script."""
    if db.query(Tool).filter(Tool.matricule == payload.matricule).first():
        raise HTTPException(status_code=400, detail="Ce matricule existe déjà")
    tool = Tool(**payload.model_dump())
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
    if "matricule" in data and data["matricule"] is not None:
        new_matricule = data["matricule"].strip()
        if not new_matricule:
            raise HTTPException(status_code=400, detail="Le matricule ne peut pas être vide")
        if new_matricule != tool.matricule and db.query(Tool).filter(Tool.matricule == new_matricule).first():
            raise HTTPException(status_code=400, detail="Ce matricule existe déjà")
        data["matricule"] = new_matricule

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
