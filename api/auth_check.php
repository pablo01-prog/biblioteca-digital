<?php
// ============================================================
//  auth_check.php  —  Protección de páginas privadas
//  Ruta: /BOCETO-2.1/api/auth_check.php
//
//  Uso: añade esta línea AL INICIO de cualquier PHP protegido:
//  require_once 'auth_check.php';
// ============================================================

session_start();

// Si no hay sesión activa → redirige al login
if (empty($_SESSION['usuario_id'])) {
    header('Location: /BOCETO-2.1/login.html');
    exit;
}

// Si se requiere rol admin y el usuario no lo tiene → redirige al inicio
if (isset($requiere_rol) && $_SESSION['usuario_rol'] !== $requiere_rol) {
    header('Location: /BOCETO-2.1/index.html');
    exit;
}