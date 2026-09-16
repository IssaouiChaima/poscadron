-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mer. 16 sep. 2026 à 09:55
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `pos_cadron`
--

-- --------------------------------------------------------

--
-- Structure de la table `tools`
--

CREATE TABLE `tools` (
  `id` int(11) NOT NULL,
  `matricule` varchar(20) NOT NULL,
  `section_fil` varchar(50) DEFAULT NULL,
  `hauteur_cuivre` varchar(50) DEFAULT NULL,
  `hauteur_isolant` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `tools`
--

INSERT INTO `tools` (`id`, `matricule`, `section_fil`, `hauteur_cuivre`, `hauteur_isolant`, `created_at`, `updated_at`) VALUES
(2, 'wzQ11480', NULL, 'D0', '2.3', '2026-08-18 12:20:22', '2026-08-18 12:20:22'),
(3, 'wzF32379', NULL, '23', '24', '2026-08-18 12:22:15', '2026-08-18 12:22:15'),
(4, 'wzf32380', NULL, '21-0', '18-2', '2026-08-18 12:23:17', '2026-08-18 12:23:17'),
(5, 'wzL15391', NULL, 'F-9', '7.4', '2026-08-26 11:14:52', '2026-08-26 11:14:52'),
(6, 'wzQ12365', NULL, 'G8', '9.7', '2026-08-26 11:15:49', '2026-08-26 11:15:49'),
(7, 'wzp12365', NULL, 'H-0', '10', '2026-08-26 11:17:47', '2026-08-26 11:17:47'),
(8, 'wz1272121', NULL, '8.3', '11', '2026-08-26 11:18:29', '2026-08-26 11:18:29'),
(9, 'wzQ-16969', NULL, 'F.5', '7.3', '2026-08-26 11:19:11', '2026-08-26 11:19:11'),
(10, '4712Q380', NULL, '22', '19', '2026-08-27 10:18:53', '2026-08-27 10:18:53'),
(11, '4712Q379', NULL, '24', '24', '2026-08-27 10:20:02', '2026-08-27 10:20:02'),
(12, '6001Q022', NULL, 'F', '5.6', '2026-08-27 10:22:05', '2026-08-27 10:22:05'),
(13, '6001Q391', NULL, 'F5.5F', '8.3', '2026-08-27 10:22:51', '2026-08-27 10:22:51'),
(14, '885Q63z1', NULL, 'G', '5.8', '2026-08-27 10:23:50', '2026-08-27 10:23:50'),
(15, '610644422', NULL, '9', '11.5', '2026-08-27 10:26:06', '2026-08-27 10:26:06'),
(40, 'wzf32377', '123', '23', '24', '2026-09-15 09:37:55', '2026-09-15 09:37:55'),
(41, 'wzf32377', '0.11', 'A', 'B', '2026-09-15 09:38:14', '2026-09-15 09:38:14');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `tools`
--
ALTER TABLE `tools`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_tools_id` (`id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `tools`
--
ALTER TABLE `tools`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
