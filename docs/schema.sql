CREATE DATABASE IF NOT EXISTS position_cadron
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE position_cadron;

-- Table unique de l'application : un outil = un matricule + ses deux hauteurs.
CREATE TABLE tools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matricule VARCHAR(20) NOT NULL UNIQUE,
    hauteur_cuivre VARCHAR(50),
    hauteur_isolant VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
