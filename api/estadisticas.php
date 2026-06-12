<?php
// api/estadisticas.php
require_once 'conexion.php';
header('Content-Type: application/json');

// Cuenta el total de filas (libros) y cuántos autores distintos existen
$sql = "SELECT 
            COUNT(*) as total_libros,
            COUNT(DISTINCT autor) as total_autores
        FROM libros";

$resultado = $conexion->query($sql);
echo json_encode($resultado->fetch_assoc());
?>