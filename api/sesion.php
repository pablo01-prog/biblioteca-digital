<?php
// ============================================================
//  sesion.php — Devuelve los datos de la sesión activa
//  El JavaScript lo consulta para saber quién está logueado
// ============================================================

// Cabeceras para que el navegador NUNCA guarde esta respuesta en caché
// Sin esto, el navegador podría mostrar la sesión de otro usuario
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Content-Type: application/json');

// Iniciamos la sesión para poder leer los datos que guardó login.php
session_start();

// Comprobamos si el usuario está logueado
if (isset($_SESSION['logueado']) && $_SESSION['logueado'] === true) {

    // Devolvemos los datos del usuario — sin contraseña
    echo json_encode([
        'logueado' => true,
        'id'       => $_SESSION['usuario_id'], // Necesario para filtrar préstamos por usuario
        'email'    => $_SESSION['email'],
        'rol'      => $_SESSION['rol']
    ]);

} else {

    // No hay sesión activa
    echo json_encode(['logueado' => false]);
}
?>