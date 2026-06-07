-- ============================================================
--  prueba_usuario.sql
--  Inserta un usuario de prueba con rol 'usuario'
--
--  Email:      prueba@biblioteca.com
--  Contraseña: Usuario1234
--
--  El hash está generado con password_hash('Usuario1234', PASSWORD_BCRYPT)
--  Solo para evaluación, no uses esta contraseña en producción.
-- ============================================================

INSERT INTO `usuarios` (`email`, `password_hash`, `rol`) VALUES
('prueba@biblioteca.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario');
