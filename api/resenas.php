<?php
// ============================================================
//  resenas.php — API de reseñas
//  GET  → público (cualquiera puede ver las reseñas)
//  POST → solo usuarios logueados pueden escribir una reseña
// ============================================================

session_start();
require_once 'conexion.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');

$metodo = $_SERVER['REQUEST_METHOD'];

// ── GET: devolver reseñas de un libro (público) ──────────────
if ($metodo === 'GET') {

    $libro_id = intval($_GET['libro_id'] ?? 0);

    if (!$libro_id) {
        echo json_encode([]);
        exit;
    }

    // Traemos las reseñas con el email del usuario que las escribió
    $stmt = $conexion->prepare("
        SELECT r.estrellas, r.comentario, r.created_at, u.email
        FROM resenas r
        JOIN usuarios u ON u.id = r.usuario_id
        WHERE r.libro_id = ?
        ORDER BY r.created_at DESC
    ");
    $stmt->bind_param('i', $libro_id);
    $stmt->execute();
    $resultado = $stmt->get_result();

    echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
    exit;
}

// ── POST: guardar reseña (solo logueados) ────────────────────
if ($metodo === 'POST') {

    // Para escribir una reseña sí hay que estar logueado
    if (empty($_SESSION['logueado'])) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Debes iniciar sesión para escribir una reseña']);
        exit;
    }

    $user_id    = $_SESSION['usuario_id'];
    $datos      = json_decode(file_get_contents('php://input'), true);
    $libro_id   = intval($datos['libro_id']  ?? 0);
    $estrellas  = intval($datos['estrellas'] ?? 0);
    $comentario = trim($datos['comentario']  ?? '');

    if (!$libro_id || $estrellas < 1 || $estrellas > 5) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Datos incorrectos']);
        exit;
    }

    // Comprobamos que el usuario no haya reseñado ya este libro
    $check = $conexion->prepare("SELECT id FROM resenas WHERE libro_id = ? AND usuario_id = ?");
    $check->bind_param('ii', $libro_id, $user_id);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        echo json_encode(['ok' => false, 'error' => 'Ya has reseñado este libro']);
        exit;
    }

    $stmt = $conexion->prepare("
        INSERT INTO resenas (libro_id, usuario_id, estrellas, comentario)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->bind_param('iiis', $libro_id, $user_id, $estrellas, $comentario);

    echo json_encode(['ok' => $stmt->execute()]);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
?>