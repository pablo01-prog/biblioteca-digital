<?php
// =============================================================================
// test_hash.php — Herramienta de desarrollo (NO usar en producción)
//
// Genera un hash bcrypt para una contraseña de prueba.
// Abre en el navegador: http://localhost/BibliotecaDigital/api/test_hash.php
// =============================================================================

echo password_hash('Admin1234', PASSWORD_BCRYPT);
?>
