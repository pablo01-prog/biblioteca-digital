<?php
// ============================================================
//  login.php — Comprueba las credenciales del usuario
//  Recibe email y password, y devuelve si el acceso es correcto
// ============================================================

session_start();
require_once 'conexion.php';
header('Content-Type: application/json');

// Leemos los datos que nos manda el formulario de login (en formato JSON)
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$email    = $data['email']    ?? '';
$password = $data['password'] ?? '';

// Buscamos en la base de datos el usuario con ese email
// Usamos una consulta preparada para evitar inyección SQL
$stmt = $conexion->prepare("SELECT id, password_hash, rol FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$resultado = $stmt->get_result();
$usuario   = $resultado->fetch_assoc();

// Comprobamos si existe el usuario y si la contraseña es correcta
// password_verify compara la contraseña con el hash guardado en la BD
if ($usuario && password_verify($password, $usuario['password_hash'])) {

    // Credenciales correctas: guardamos los datos en la sesión del servidor
    $_SESSION['usuario_id'] = $usuario['id'];
    $_SESSION['rol']        = $usuario['rol'];
    $_SESSION['email']      = $email;
    $_SESSION['logueado']   = true;

    // Indicamos al JavaScript a qué página redirigir según el rol
    echo json_encode([
        'ok'       => true,
        'rol'      => $usuario['rol'],
        'redirect' => ($usuario['rol'] === 'admin') ? 'administracion.html' : 'mis-libros.html'
    ]);

} else {

    // Credenciales incorrectas
    echo json_encode(['ok' => false, 'error' => 'Correo o contraseña incorrectos']);
}
?>