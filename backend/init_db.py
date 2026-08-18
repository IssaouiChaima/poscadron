"""
Script utilitaire : crée la table `tools` dans MySQL à partir du modèle SQLAlchemy.
A lancer une fois que la base MySQL 'position_cadron' existe.

Usage : python init_db.py
"""
from app_single import Base, engine

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Table 'tools' créée avec succès dans la base de données.")
