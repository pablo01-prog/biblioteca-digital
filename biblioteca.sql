SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET FOREIGN_KEY_CHECKS=0;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Base de datos: `biblioteca`

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('admin','usuario') COLLATE utf8mb4_unicode_ci DEFAULT 'usuario',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`id`, `email`, `password_hash`, `rol`, `created_at`) VALUES
(1, 'admin@biblioteca.com', '$2y$10$KIqUYWZ7OQmF1ONcGzYiCOy2uWCVJU6v87uQXW6MAce4YyCGyG9Ha', 'admin', '2026-03-21 09:34:37'),
(2, 'pablogh@gmail.com', '$2y$10$sjJ3szc6FJSYSDZ4FrgMn.5jJzCcitzZHrulVt27GR0GpYYv2cGAm', 'usuario', '2026-04-25 10:35:31'),
(3, 'celiagh@gmail.com', '$2y$10$bIK7j1cbD06vKUxNx9jhK.Pwy6GKofqwkqUi80G2Ihp9VPJONg4Ue', 'usuario', '2026-04-28 09:49:16');

DROP TABLE IF EXISTS `libros`;
CREATE TABLE IF NOT EXISTS `libros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `autor` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `genero` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('disponible','prestado') COLLATE utf8mb4_unicode_ci DEFAULT 'disponible',
  `imagen_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `libros` (`id`, `titulo`, `autor`, `genero`, `estado`, `imagen_url`, `descripcion`, `created_at`) VALUES
(2, 'Harry Potter y la piedra filosofal', 'J.K. Rowling', 'Fantasía', 'prestado', NULL, NULL, '2026-03-21 09:34:37'),
(3, '1984', 'George Orwell', 'Ciencia ficción', 'disponible', NULL, NULL, '2026-03-21 09:34:37'),
(4, 'Cien años de soledad', 'Gabriel García Márquez', 'Realismo mágico', 'prestado', NULL, NULL, '2026-03-21 09:34:37'),
(5, 'El Hobbit', 'J.R.R. Tolkien', 'Fantasía', 'disponible', NULL, NULL, '2026-03-21 09:34:37'),
(6, 'Don Quijote de la Mancha', 'Miguel de Cervantes', 'Clásico', 'disponible', NULL, NULL, '2026-05-17 10:31:17'),
(7, 'Geronimo Stilton', 'Fernando Garcia', 'Infantil', 'disponible', NULL, NULL, '2026-04-28 10:02:41'),
(8, 'Dune', 'Frank Herbert', 'Ciencia ficción', 'prestado', NULL, NULL, '2026-05-07 15:47:51'),
(9, 'Fahrenheit 451', 'Ray Bradbury', 'Ciencia ficción', 'disponible', NULL, NULL, '2026-05-17 10:31:17'),
(10, 'Los juegos del hambre', 'Suzanne Collins', 'Distopía', 'disponible', NULL, NULL, '2026-05-17 10:31:17'),
(11, 'Orgullo y prejuicio', 'Jane Austen', 'Romance', 'prestado', NULL, NULL, '2026-05-17 10:31:17'),
(12, 'Drácula', 'Bram Stoker', 'Terror', 'disponible', NULL, NULL, '2026-05-17 10:31:17'),
(13, 'La Odisea', 'Homero', 'Épico', 'disponible', NULL, NULL, '2026-05-17 10:31:17'),
(14, 'El código Da Vinci', 'Dan Brown', 'Misterio', 'disponible', NULL, NULL, '2026-05-17 10:31:17'),
(15, 'Matar a un ruiseñor', 'Harper Lee', 'Drama', 'prestado', NULL, NULL, '2026-05-17 10:31:17'),
(16, 'It', 'Stephen King', 'Terror', 'disponible', NULL, NULL, '2026-05-17 10:31:17'),
(17, 'Rebelión en la granja', 'George Orwell', 'Satírico', 'disponible', NULL, NULL, '2026-05-17 10:31:17'),
(18, 'El nombre del viento', 'Patrick Rothfuss', 'Fantasía', 'disponible', NULL, NULL, '2026-05-17 10:31:17'),
(19, 'La chica del tren', 'Paula Hawkins', 'Thriller', 'disponible', NULL, NULL, '2026-05-17 10:31:17'),
(20, 'Sapiens', 'Yuval Noah Harari', 'Historia', 'disponible', NULL, NULL, '2026-05-17 10:31:17');

DROP TABLE IF EXISTS `historial_prestamos`;
CREATE TABLE IF NOT EXISTS `historial_prestamos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `libro_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `fecha_prestamo` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_devolucion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `libro_id` (`libro_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `fk_prestamo_libro`   FOREIGN KEY (`libro_id`)   REFERENCES `libros` (`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_prestamo_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `historial_prestamos` (`id`, `libro_id`, `usuario_id`, `fecha_prestamo`, `fecha_devolucion`) VALUES
(1, 5, 2, '2026-05-08 23:32:41', '2026-05-08 23:33:21'),
(2, 8, 2, '2026-05-08 23:33:23', NULL),
(3, 11, 2, '2026-05-17 19:31:30', NULL),
(4, 15, 2, '2026-05-17 19:31:30', NULL);

DROP TABLE IF EXISTS `notas_privadas`;
CREATE TABLE IF NOT EXISTS `notas_privadas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `libro_id` int NOT NULL,
  `nota` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unica_nota` (`usuario_id`,`libro_id`),
  KEY `libro_id` (`libro_id`),
  CONSTRAINT `fk_nota_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nota_libro`   FOREIGN KEY (`libro_id`)   REFERENCES `libros` (`id`)   ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `notas_privadas` (`id`, `usuario_id`, `libro_id`, `nota`) VALUES
(1, 2, 8, 'Voy por el capítulo 3.');

DROP TABLE IF EXISTS `preferencias`;
CREATE TABLE IF NOT EXISTS `preferencias` (
  `usuario_id` int NOT NULL,
  `genero` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `autor` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`usuario_id`),
  CONSTRAINT `fk_pref_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `preferencias` (`usuario_id`, `genero`, `autor`) VALUES
(2, 'Terror', 'García Marquez');

DROP TABLE IF EXISTS `resenas`;
CREATE TABLE IF NOT EXISTS `resenas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `libro_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `estrellas` tinyint NOT NULL,
  `comentario` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `libro_id` (`libro_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `fk_resena_libro`   FOREIGN KEY (`libro_id`)   REFERENCES `libros` (`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_resena_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `resenas` (`id`, `libro_id`, `usuario_id`, `estrellas`, `comentario`, `created_at`) VALUES
(1, 8, 2, 4, 'Me gustó mucho el libro.', '2026-05-17 12:25:00');

SET FOREIGN_KEY_CHECKS=1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
