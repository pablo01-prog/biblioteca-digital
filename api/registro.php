<?php
// ============================================================
//  registro.php — Registra un nuevo usuario
//  Recibe email y password, y crea la cuenta en la BD
// ============================================================

session_start();
require_once 'conexion.php';
header('Content-Type: application/json');

// Solo aceptamos peticiones POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

// Leemos los datos que nos manda el formulario (en formato JSON)
$json     = file_get_contents('php://input');
$datos    = json_decode($json, true);

$email    = trim($datos['email']    ?? '');
$password = trim($datos['password'] ?? '');

// Comprobamos que nos han mandado los dos campos obligatorios
if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Email y contraseña son obligatorios']);
    exit;
}

// Comprobamos que el email no está ya registrado
$check = $conexion->prepare('SELECT id FROM usuarios WHERE email = ?');
$check->bind_param('s', $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['ok' => false, 'error' => 'Ya existe una cuenta con ese correo']);
    exit;
}

// Guardamos la contraseña cifrada — NUNCA en texto plano
$hash = password_hash($password, PASSWORD_BCRYPT);

// Insertamos el nuevo usuario con rol 'usuario' por defecto
$stmt = $conexion->prepare('INSERT INTO usuarios (email, password_hash, rol) VALUES (?, ?, ?)');
$rol  = 'usuario';
$stmt->bind_param('sss', $email, $hash, $rol);

if ($stmt->execute()) {
    // Cuenta creada: iniciamos sesión automáticamente
    $_SESSION['usuario_id'] = $conexion->insert_id;
    $_SESSION['rol']        = $rol;
    $_SESSION['email']      = $email;
    $_SESSION['logueado']   = true;

    echo json_encode([
        'ok'       => true,
        'mensaje'  => 'Cuenta creada correctamente',
        'redirect' => 'mis-libros.html'
    ]);
} else {
    echo json_encode(['ok' => false, 'error' => 'Error al crear la cuenta. Inténtalo de nuevo.']);
}
?>
