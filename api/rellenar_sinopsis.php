<?php
// ============================================================
//  rellenar_sinopsis.php
//  Script de uso único: rellena la sinopsis de todos los libros
//  que tienen descripcion = NULL consultando Google Books.
//
//  Úsalo así: abre en el navegador
//  http://localhost/BibliotecaDigital/api/rellenar_sinopsis.php
// ============================================================

session_start();
require_once 'conexion.php';
header('Content-Type: text/html; charset=utf-8');

// 1. CONTROL DE ACCESO: Solo puede ejecutarlo un admin logueado
if (!isset($_SESSION['logueado']) || $_SESSION['rol'] != 'admin') {
    echo '<p style="color:red; font-weight:bold;">Acceso denegado. Inicia sesión como administrador en la biblioteca primero e intenta recargar esta pestaña.</p>';
    exit();
}

// Cogemos todos los libros cuya sinopsis esté vacía o sea NULL
$resultado = $conexion->query("SELECT id, titulo, autor FROM libros WHERE descripcion IS NULL OR descripcion = ''");
$libros = $resultado->fetch_all(MYSQLI_ASSOC);

echo '<h2>Procesando generación de sinopsis...</h2><ul>';

if (empty($libros)) {
    echo '<li>Documento al día: No quedan libros con la sinopsis vacía en la base de datos.</li></ul>';
    exit();
}

// CONTEXTO DE CONEXIÓN: Truco clave para ignorar la verificación SSL estricta en local (WAMP/XAMPP)
// Esto evita que Google Books rechace la petición por falta de certificados locales cacert.pem
$contexto_ssl = stream_context_create([
    "ssl" => [
        "verify_peer" => false,
        "verify_peer_name" => false,
    ],
]);

foreach ($libros as $libro) {
    $query = urlencode($libro['titulo'] . ' ' . $libro['autor']);
    $url   = 'https://www.googleapis.com/books/v1/volumes?q=' . $query . '&maxResults=1&langRestrict=es';

    // Esperamos 1 segundo entre peticiones para ser educados con la API de Google
    sleep(1);

    // Ejecutamos la petición pasándole nuestro contexto SSL modificado
    $respuesta = @file_get_contents($url, false, $contexto_ssl);

    if ($respuesta === false) {
        echo '<li>❌ ' . htmlspecialchars($libro['titulo']) . ' — Error de conexión con la API de Google</li>';
        continue;
    }

    $datos = json_decode($respuesta, true);

    // Verificación segura: comprobamos si realmente ha devuelto la estructura de "items"
    if (!isset($datos['items']) || count($datos['items']) == 0) {
        echo '<li>⚠️ ' . htmlspecialchars($libro['titulo']) . ' — No se encontró ninguna coincidencia</li>';
        continue;
    }

    $info        = $datos['items'][0]['volumeInfo'];
    $descripcion = isset($info['description']) ? substr($info['description'], 0, 600) : '';

    if (trim($descripcion) == '') {
        echo '<li>⚠️ ' . htmlspecialchars($libro['titulo']) . ' — Encontrado, pero no tiene sinopsis de texto disponible</li>';
        continue;
    }

    // Guardamos la descripción recuperada en la BD
    $stmt = $conexion->prepare("UPDATE libros SET descripcion = ? WHERE id = ?");
    $stmt->bind_param('si', $descripcion, $libro['id']);
    $stmt->execute();

    echo '<li>✅ <strong>' . htmlspecialchars($libro['titulo']) . '</strong> — Sinopsis generada e inyectada con éxito.</li>';
}

echo '</ul><p><strong>¡Proceso completado con éxito!</strong> Puedes volver al panel de administración.</p>';
?>