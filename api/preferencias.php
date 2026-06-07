<?php
// ============================================================
//  preferencias.php — API de preferencias (GET y POST)
//  GET  → devuelve las preferencias del usuario logueado
//  POST → guarda o actualiza sus preferencias
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

// ── GET: devolver preferencias del usuario ───────────────────
if ($metodo === 'GET') {

    $stmt = $conexion->prepare("SELECT genero, autor FROM preferencias WHERE usuario_id = ?");
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $fila      = $resultado->fetch_assoc();

    // Si no tiene preferencias aún, devolvemos valores vacíos
    echo json_encode($fila ?? ['genero' => '', 'autor' => '']);
}

// ── POST: guardar o actualizar preferencias ──────────────────
else if ($metodo === 'POST') {

    $datos  = json_decode(file_get_contents('php://input'), true);
    $genero = trim($datos['genero'] ?? '');
    $autor  = trim($datos['autor']  ?? '');

    // ── Validar género: tiene que existir en la tabla libros ──
    if ($genero !== '') {
        $chk = $conexion->prepare("SELECT COUNT(*) as total FROM libros WHERE LOWER(genero) = LOWER(?)");
        $chk->bind_param('s', $genero);
        $chk->execute();
        $fila = $chk->get_result()->fetch_assoc();
        if ($fila['total'] == 0) {
            $genero = null; // Género no reconocido → guardamos null
        }
    } else {
        $genero = null;
    }

    // ── Validar autor: tiene que existir en la tabla libros ───
    if ($autor !== '') {
        $chk2 = $conexion->prepare("SELECT COUNT(*) as total FROM libros WHERE LOWER(autor) LIKE LOWER(?)");
        $buscar = '%' . $autor . '%';
        $chk2->bind_param('s', $buscar);
        $chk2->execute();
        $fila2 = $chk2->get_result()->fetch_assoc();
        if ($fila2['total'] == 0) {
            $autor = null; // Autor no reconocido → guardamos null
        }
    } else {
        $autor = null;
    }

    // INSERT OR UPDATE — si ya existe la fila la actualizamos
    $stmt = $conexion->prepare("
        INSERT INTO preferencias (usuario_id, genero, autor)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE genero = VALUES(genero), autor = VALUES(autor)
    ");
    $stmt->bind_param('iss', $user_id, $genero, $autor);
    $stmt->execute();

    // Devolvemos qué se guardó realmente para que el JS lo muestre
    echo json_encode([
        'ok'     => true,
        'genero' => $genero,
        'autor'  => $autor,
        'aviso'  => ($genero === null && $datos['genero'] !== '') || ($autor === null && $datos['autor'] !== '')
                    ? 'Algunos valores no coinciden con el catálogo y se han descartado.'
                    : null
    ]);

} else {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
}
?>