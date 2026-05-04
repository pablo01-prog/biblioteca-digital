<?php
// ============================================================
//  libros.php — API de libros (GET, POST, PUT, DELETE)
//  Gestiona todas las operaciones sobre la tabla libros
// ============================================================

session_start();
require_once 'conexion.php';

// Cabeceras para evitar que el navegador cachee los datos de libros
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Content-Type: application/json');

// Solo pueden usar esta API los usuarios logueados
if (empty($_SESSION['logueado'])) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Debes iniciar sesión']);
    exit;
}

// Leemos qué tipo de petición nos llega (GET, POST, PUT o DELETE)
$metodo  = $_SERVER['REQUEST_METHOD'];

// Datos del usuario logueado, guardados en la sesión por login.php
$user_id = $_SESSION['usuario_id'] ?? null;
$rol     = $_SESSION['rol']        ?? 'usuario';

// ── GET: devolver todos los libros ───────────────────────────
if ($metodo === 'GET') {

    // Consultamos todos los libros, incluyendo usuario_id
    // El JavaScript usará usuario_id para saber qué libros pertenecen a cada usuario
    $resultado = $conexion->query('SELECT id, titulo, autor, estado, usuario_id FROM libros ORDER BY titulo ASC');
    echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
}

// ── POST: añadir un libro nuevo (solo admin) ─────────────────
else if ($metodo === 'POST') {

    // Solo el administrador puede añadir libros
    if ($rol !== 'admin') {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Solo los administradores pueden añadir libros']);
        exit;
    }

    // Leemos los datos que manda el formulario
    $datos  = json_decode(file_get_contents('php://input'), true);
    $titulo = trim($datos['titulo'] ?? '');
    $autor  = trim($datos['autor']  ?? '');
    $estado = trim($datos['estado'] ?? 'disponible');

    // Comprobamos que los campos obligatorios no estén vacíos
    if (!$titulo || !$autor) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Título y autor son obligatorios']);
        exit;
    }

    // Insertamos el libro en la base de datos
    $stmt = $conexion->prepare('INSERT INTO libros (titulo, autor, estado) VALUES (?, ?, ?)');
    $stmt->bind_param('sss', $titulo, $autor, $estado);

    if ($stmt->execute()) {
        echo json_encode(['ok' => true, 'id' => $conexion->insert_id]);
    } else {
        echo json_encode(['ok' => false, 'error' => 'Error al guardar el libro']);
    }
}

// ── PUT: cambiar el estado de un libro (prestar o devolver) ──
else if ($metodo === 'PUT') {

    $datos    = json_decode(file_get_contents('php://input'), true);
    $libro_id = intval($datos['id']    ?? 0);
    $estado   = trim($datos['estado']  ?? '');

    // Comprobamos que los datos son válidos
    if (!$libro_id || !in_array($estado, ['prestado', 'disponible'])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Datos incorrectos']);
        exit;
    }

    if ($estado === 'prestado') {
        // Al prestar: guardamos qué usuario se lleva el libro
        $stmt = $conexion->prepare("UPDATE libros SET estado = 'prestado', usuario_id = ? WHERE id = ?");
        $stmt->bind_param('ii', $user_id, $libro_id);
    } else {
        // Al devolver: quitamos la asociación con el usuario
        $stmt = $conexion->prepare("UPDATE libros SET estado = 'disponible', usuario_id = NULL WHERE id = ?");
        $stmt->bind_param('i', $libro_id);
    }

    echo json_encode(['ok' => $stmt->execute()]);
}

// ── DELETE: eliminar un libro (solo admin) ───────────────────
else if ($metodo === 'DELETE') {

    if ($rol !== 'admin') {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Solo los administradores pueden eliminar libros']);
        exit;
    }

    $datos = json_decode(file_get_contents('php://input'), true);
    $id    = intval($datos['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'ID no válido']);
        exit;
    }

    $stmt = $conexion->prepare('DELETE FROM libros WHERE id = ?');
    $stmt->bind_param('i', $id);
    echo json_encode(['ok' => $stmt->execute()]);
}

// ── Método no permitido ──────────────────────────────────────
else {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
}
?>