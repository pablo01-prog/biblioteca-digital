<?php
// =============================================================================
// auth_check.php — Protección opcional para páginas PHP del servidor
//
// NO se usa en este proyecto (la protección está en JavaScript con sesion.php).
// Si en el futuro creas páginas PHP privadas, incluye al inicio:
//   require_once 'auth_check.php';
//
// Redirige al login si no hay sesión. Si defines $requiere_rol = 'admin',
// también comprueba que el usuario tenga ese rol.
// =============================================================================

session_start();

if (!isset($_SESSION['logueado']) || $_SESSION['logueado'] !== true) {
    header('Location: ../login.html');
    exit();
}

if (isset($requiere_rol) && $_SESSION['rol'] !== $requiere_rol) {
    header('Location: ../index.html');
    exit();
}
?>
