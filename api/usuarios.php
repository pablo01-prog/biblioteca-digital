<?php
// ============================================================
//  usuarios.php — API de usuarios (GET, POST, PUT, DELETE)
//  Solo accesible por administradores
// ============================================================

session_start();
require_once 'conexion.php';
header('Content-Type: application/json');

// Comprobamos que el usuario es administrador
// Si no, devolvemos error y paramos
if (empty($_SESSION['logueado']) || $_SESSION['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Acceso denegado']);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];

// ── GET: devolver lista de usuarios SIN contraseña ───────────
if ($metodo === 'GET') {

    // Seleccionamos solo los campos que necesitamos — NUNCA password_hash
    $resultado = $conexion->query('SELECT id, email, rol, created_at FROM usuarios ORDER BY created_at DESC');
    echo json_encode($resultado->fetch_all(MYSQLI_ASSOC));
}

// ── POST: crear un usuario nuevo ─────────────────────────────
else if ($metodo === 'POST') {

    $datos    = json_decode(file_get_contents('php://input'), true);
    $email    = trim($datos['email']    ?? '');
    $password = trim($datos['password'] ?? '');
    $rol      = trim($datos['rol']      ?? 'usuario');

    // Comprobamos campos obligatorios
    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Email y contraseña son obligatorios']);
        exit;
    }

    // Comprobamos que el email no esté ya registrado
    $check = $conexion->prepare('SELECT id FROM usuarios WHERE email = ?');
    $check->bind_param('s', $email);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['ok' => false, 'error' => 'Ya existe un usuario con ese email']);
        exit;
    }

    // Guardamos la contraseña cifrada con bcrypt — NUNCA en texto plano
    $hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $conexion->prepare('INSERT INTO usuarios (email, password_hash, rol) VALUES (?, ?, ?)');
    $stmt->bind_param('sss', $email, $hash, $rol);

    if ($stmt->execute()) {
        echo json_encode(['ok' => true, 'id' => $conexion->insert_id]);
    } else {
        echo json_encode(['ok' => false, 'error' => 'Error al crear el usuario']);
    }
}

// ── PUT: editar email, rol y opcionalmente contraseña ────────
else if ($metodo === 'PUT') {

    $datos = json_decode(file_get_contents('php://input'), true);
    $id    = intval($datos['id']    ?? 0);
    $email = trim($datos['email']   ?? '');
    $rol   = trim($datos['rol']     ?? '');

    if (!$id) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'ID requerido']);
        exit;
    }

    // Si se ha enviado nueva contraseña, la actualizamos también
    if (!empty($datos['password'])) {
        $hash = password_hash($datos['password'], PASSWORD_BCRYPT);
        $stmt = $conexion->prepare('UPDATE usuarios SET email = ?, rol = ?, password_hash = ? WHERE id = ?');
        $stmt->bind_param('sssi', $email, $rol, $hash, $id);
    } else {
        // Si no hay nueva contraseña, solo actualizamos email y rol
        $stmt = $conexion->prepare('UPDATE usuarios SET email = ?, rol = ? WHERE id = ?');
        $stmt->bind_param('ssi', $email, $rol, $id);
    }

    echo json_encode(['ok' => $stmt->execute()]);
}

// ── DELETE: eliminar un usuario ──────────────────────────────
else if ($metodo === 'DELETE') {

    $datos = json_decode(file_get_contents('php://input'), true);
    $id    = intval($datos['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'ID requerido']);
        exit;
    }

    $stmt = $conexion->prepare('DELETE FROM usuarios WHERE id = ?');
    $stmt->bind_param('i', $id);
    echo json_encode(['ok' => $stmt->execute()]);
}

// ── Método no permitido ──────────────────────────────────────
else {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
}
?>