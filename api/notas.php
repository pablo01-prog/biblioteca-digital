<?php
// ============================================================
//  notas.php — API de notas privadas (GET y POST)
//  GET  → devuelve la nota del usuario para un libro concreto
//  POST → guarda o actualiza esa nota
// ============================================================

session_start();
require_once 'conexion.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');

if (empty($_SESSION['logueado'])) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Debes iniciar sesión']);
    exit;
}

$metodo  = $_SERVER['REQUEST_METHOD'];
$user_id = $_SESSION['usuario_id'];

// ── GET: devolver la nota de un libro ────────────────────────
if ($metodo === 'GET') {

    $libro_id = intval($_GET['libro_id'] ?? 0);

    if (!$libro_id) {
        echo json_encode(['nota' => '']);
        exit;
    }

    $stmt = $conexion->prepare("
        SELECT nota FROM notas_privadas
        WHERE usuario_id = ? AND libro_id = ?
    ");
    $stmt->bind_param('ii', $user_id, $libro_id);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $fila      = $resultado->fetch_assoc();

    echo json_encode(['nota' => $fila['nota'] ?? '']);
}

// ── POST: guardar o actualizar la nota ───────────────────────
else if ($metodo === 'POST') {

    $datos    = json_decode(file_get_contents('php://input'), true);
    $libro_id = intval($datos['libro_id'] ?? 0);
    $nota     = trim($datos['nota']       ?? '');

    if (!$libro_id) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Falta el libro_id']);
        exit;
    }

    // INSERT OR UPDATE — una sola nota por usuario y libro
    $stmt = $conexion->prepare("
        INSERT INTO notas_privadas (usuario_id, libro_id, nota)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE nota = VALUES(nota)
    ");
    $stmt->bind_param('iis', $user_id, $libro_id, $nota);

    echo json_encode(['ok' => $stmt->execute()]);

} else {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
}
?>