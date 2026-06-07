<?php
// ============================================================
//  conexion.php — Conexión a la base de datos MySQL
// ============================================================

// Variables con los datos de acceso para WAMPP
$host     = 'localhost';  // El servidor local
$bd       = 'biblioteca'; // La base de datos del proyecto
$usuario  = 'root';       // El usuario administrador por defecto
$password = '';           // En WAMPP viene sin contraseña

// Conectamos a la base de datos usando la clase mysql
$conexion = new mysqli($host, $usuario, $password, $bd);

// Comprobamos si la conexión ha fallado
if ($conexion->connect_error) {
    // Si hay error, creamos la respuesta en un array
    $respuesta = [
        "ok" => false, // Este será el indicador del que apoyarse en todas las consultas con la BD desde js
        "error" => "No se pudo conectar a la base de datos: " . $conexion->connect_error
    ];
    
    // Lo convertimos a JSON y cerramos el script para que no siga ejecutando
    echo json_encode($respuesta);
    exit();
}

// Configuramos los caracteres para que no salgan cosas raras con las tildes y las Ñs
$conexion->set_charset("utf8");
?>