<?php
// ============================================================
//  conexion.php — Conexión a la base de datos MySQL
//  Se incluye en todos los archivos PHP que necesiten la BD
// ============================================================

// Datos de acceso a la base de datos
$host     = 'localhost';  // Servidor de base de datos (local en XAMPP)
$bd       = 'biblioteca'; // Nombre de la base de datos
$usuario  = 'root';       // Usuario de MySQL
$password = '';           // Contraseña (vacía en XAMPP por defecto)

// Creamos la conexión con MySQLi
$conexion = new mysqli($host, $usuario, $password, $bd);

// Comprobamos si hubo algún error al conectar
if ($conexion->connect_error) {
    // Si falla, devolvemos un error en formato JSON y paramos
    die(json_encode(['ok' => false, 'error' => 'Error de conexión: ' . $conexion->connect_error]));
}

// Establecemos el juego de caracteres para soportar tildes y caracteres especiales
$conexion->set_charset("utf8mb4");
?>