<?php
// ============================================================
//  rellenar_sinopsis.php
//  Script de uso único: rellena la sinopsis de todos los libros
//  que tienen descripcion = NULL consultando Google Books.
//
//  Úsalo así: abre en el navegador
//  http://localhost/BibliotecaDigital/api/rellenar_sinopsis.php
//
//  Puedes borrarlo después de ejecutarlo.
// ============================================================

session_start();
require_once 'conexion.php';
header('Content-Type: text/html; charset=utf-8');

// Solo puede ejecutarlo un admin logueado
if (!isset($_SESSION['logueado']) || $_SESSION['rol'] != 'admin') {
    echo '<p>Acceso denegado. Inicia sesión como administrador primero.</p>';
    exit();
}

// Cogemos todos los libros sin sinopsis
$resultado = $conexion->query("SELECT id, titulo, autor FROM libros WHERE descripcion IS NULL OR descripcion = ''");
$libros = $resultado->fetch_all(MYSQLI_ASSOC);

echo '<h2>Rellenando sinopsis...</h2><ul>';

foreach ($libros as $libro) {
    $query = urlencode($libro['titulo'] . ' ' . $libro['autor']);
    $url   = 'https://www.googleapis.com/books/v1/volumes?q=' . $query . '&maxResults=1&langRestrict=es';

    // Esperamos 1 segundo entre peticiones para no saturar Google Books
    sleep(1);

    $respuesta = file_get_contents($url);

    if ($respuesta === false) {
        echo '<li>❌ ' . htmlspecialchars($libro['titulo']) . ' — error de red</li>';
        continue;
    }

    $datos = json_decode($respuesta, true);

    if (!isset($datos['totalItems']) || $datos['totalItems'] == 0) {
        echo '<li>⚠️ ' . htmlspecialchars($libro['titulo']) . ' — no encontrado</li>';
        continue;
    }

    $info        = $datos['items'][0]['volumeInfo'];
    $descripcion = isset($info['description']) ? substr($info['description'], 0, 600) : '';

    if ($descripcion == '') {
        echo '<li>⚠️ ' . htmlspecialchars($libro['titulo']) . ' — sin descripción en Google Books</li>';
        continue;
    }

    // Guardamos la descripción en la BD
    $stmt = $conexion->prepare("UPDATE libros SET descripcion = ? WHERE id = ?");
    $stmt->bind_param('si', $descripcion, $libro['id']);
    $stmt->execute();

    echo '<li>✅ ' . htmlspecialchars($libro['titulo']) . '</li>';

    // Forzamos que el navegador muestre el progreso en tiempo real
    ob_flush();
    flush();
}

echo '</ul><p><strong>¡Listo! Puedes borrar este archivo.</strong></p>';
?>
