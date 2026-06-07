<?php
// ============================================================
//  logout.php — Cierra la sesión del usuario
//  Destruye todos los datos de sesión y redirige al login
// ============================================================

session_start();

// Vaciamos todos los datos guardados en la sesión
$_SESSION = [];

// Eliminamos también la cookie de sesión del navegador
// Sin esto, el navegador podría mantener la cookie aunque la sesión esté destruida
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(), // Nombre de la cookie de sesión
        '',             // Valor vacío
        time() - 3600, // Fecha de expiración en el pasado (la elimina)
        $params['path'],
        $params['domain'],
        $params['secure'],
        $params['httponly']
    );
}

// Destruimos la sesión en el servidor
session_destroy();

// Cabeceras para limpiar el caché del navegador
// Así el navegador no mostrará datos de la sesión anterior
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

// Redirigimos al login
header('Location: ../login.html');
exit;
?>