<?php
// ============================================================
//  libros.php — API de libros (GET, POST, PUT, DELETE)
// ============================================================

session_start();
// Importamos el archivo de conexión para tener disponible la variable $conexion
require_once 'conexion.php';

// Cabecera obligatoria para avisar al navegador de que respondemos con texto JSON
header('Content-Type: application/json');

// Averiguamos si la petición es GET, POST, PUT o DELETE
$metodo = $_SERVER['REQUEST_METHOD'];

// Coger los datos de la sesion
$user_id = null;
if (isset($_SESSION['usuario_id'])) {
    $user_id = $_SESSION['usuario_id'];
}

$rol = 'usuario';
if (isset($_SESSION['rol'])) {
    $rol = $_SESSION['rol'];
}

$logueado = false;
if (isset($_SESSION['logueado']) && $_SESSION['logueado'] == true) {
    $logueado = true;
}


// ── 1. MÉTODO GET: CONSULTAR EL CATÁLOGO (PÚBLICO) ──────────
if ($metodo == 'GET') {

    // Consulta SQL que cruza los libros con el historial para ver quién lo tiene prestado
    $sql = "SELECT l.id, l.titulo, l.autor, l.genero, l.estado, l.imagen_url, l.descripcion, h.usuario_id 
            FROM libros l 
            LEFT JOIN historial_prestamos h ON h.libro_id = l.id AND h.fecha_devolucion IS NULL 
            ORDER BY l.titulo ASC";

    $resultado = $conexion->query($sql);
    

    // Del array entero extraemos la info que queramos 
    // Sacamos todos los registros en un array asociativo
    $listaLibros = $resultado->fetch_all(MYSQLI_ASSOC);
    
    // Lo lanzamos en formato JSON para que lo lea el JS
    echo json_encode($listaLibros);
    exit();
}


// A PARTIR DE AQUÍ, SI NO ESTÁ LOGUEADO, LE CORTAMOS EL PASO
if ($logueado == false) {
    echo json_encode(['ok' => false, 'error' => 'Debes iniciar sesión']);
    exit();
}


// ── 2. MÉTODO POST: AÑADIR UN LIBRO NUEVO (SOLO ADMIN) ───────
if ($metodo == 'POST') {

    // Control de seguridad por si intentan saltarse el formulario
    if ($rol != 'admin') {
        echo json_encode(['ok' => false, 'error' => 'Solo los administradores pueden añadir libros']);
        exit();
    }

    // Leemos el JSON crudo que nos manda el fetch() de JavaScript
    $jsonRecibido = file_get_contents('php://input');
    $datos = json_decode($jsonRecibido, true);

    // Guardamos los datos en variables limpiando espacios en blanco (trim)
    $titulo      = isset($datos['titulo']) ? trim($datos['titulo']) : '';
    $autor       = isset($datos['autor']) ? trim($datos['autor']) : '';
    $genero      = isset($datos['genero']) ? trim($datos['genero']) : '';
    $estado      = isset($datos['estado']) ? trim($datos['estado']) : 'disponible';
    $imagen_url  = isset($datos['imagen_url']) ? trim($datos['imagen_url']) : '';
    $descripcion = isset($datos['descripcion']) ? trim($datos['descripcion']) : '';

    // Si el administrador no metió una foto, le asignamos una por defecto
    if ($imagen_url == "") {
        $imagen_url = 'imagenes/portada_libro.png';
    }

    // Validación básica: título y autor no pueden estar vacíos
    if ($titulo == "" || $autor == "") {
        echo json_encode(['ok' => false, 'error' => 'Título y autor son obligatorios']);
        exit();
    }

    // Preparamos la consulta con interrogantes por seguridad (Evitar SQL Injection)
    $stmt = $conexion->prepare("INSERT INTO libros (titulo, autor, genero, estado, imagen_url, descripcion) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('ssssss', $titulo, $autor, $genero, $estado, $imagen_url, $descripcion);

    if ($stmt->execute()) {
        // Devolvemos que ha ido bien y el ID que la base de datos le ha asignado automáticamente
        echo json_encode(['ok' => true, 'id' => $conexion->insert_id]);
    } else {
        echo json_encode(['ok' => false, 'error' => 'Error al guardar el libro']);
    }
    exit();
}


// ── 3. MÉTODO PUT: PRESTAR O DEVOLVER UN LIBRO ───────────────
if ($metodo == 'PUT') {

    $jsonRecibido = file_get_contents('php://input');
    $datos = json_decode($jsonRecibido, true);

    // Aseguramos que el id sea un número entero válido (intval)
    $libro_id = isset($datos['id']) ? intval($datos['id']) : 0;
    $estado   = isset($datos['estado']) ? trim($datos['estado']) : '';

    if ($libro_id == 0 || ($estado != 'prestado' && $estado != 'disponible')) {
        echo json_encode(['ok' => false, 'error' => 'Datos incorrectos']);
        exit();
    }

    // ACCIÓN ESPECIAL: GUARDAR DATOS DE GOOGLE BOOKS (portada y sinopsis)
    if (isset($datos['guardar_gb']) && $datos['guardar_gb'] == true) {
        $imagen_url  = isset($datos['imagen_url'])  ? trim($datos['imagen_url'])  : '';
        $descripcion = isset($datos['descripcion']) ? trim($datos['descripcion']) : '';

        $stmt = $conexion->prepare("UPDATE libros SET imagen_url = ?, descripcion = ? WHERE id = ?");
        $stmt->bind_param('ssi', $imagen_url, $descripcion, $libro_id);
        echo json_encode(['ok' => $stmt->execute()]);
        exit();
    }

    // ACCIÓN A: PRESTAR EL LIBRO
    if ($estado == 'prestado') {
        
        // 1. Cambiamos el estado en la tabla libros
        $stmt = $conexion->prepare("UPDATE libros SET estado = 'prestado' WHERE id = ?");
        $stmt->bind_param('i', $libro_id);
        $stmt->execute();

        // 2. Insertamos una nueva fila en el historial de préstamos marcando la hora actual (NOW())
        $stmt2 = $conexion->prepare("INSERT INTO historial_prestamos (libro_id, usuario_id, fecha_prestamo) VALUES (?, ?, NOW())");
        $stmt2->bind_param('ii', $libro_id, $user_id);
        $resultadoFinal = $stmt2->execute();

        echo json_encode(['ok' => $resultadoFinal]);

    // ACCIÓN B: DEVOLVER EL LIBRO
    } else {
        
        // 1. Volvemos a poner el libro como disponible
        $stmt = $conexion->prepare("UPDATE libros SET estado = 'disponible' WHERE id = ?");
        $stmt->bind_param('i', $libro_id);
        $stmt->execute();

        // 2. Buscamos el préstamo activo de este usuario y le ponemos la fecha de devolución actual
        $stmt2 = $conexion->prepare("UPDATE historial_prestamos SET fecha_devolucion = NOW() WHERE libro_id = ? AND usuario_id = ? AND fecha_devolucion IS NULL");
        $stmt2->bind_param('ii', $libro_id, $user_id);
        $resultadoFinal = $stmt2->execute();

        echo json_encode(['ok' => $resultadoFinal]);
    }
    exit();
}


// ── 4. MÉTODO DELETE: ELIMINAR UN LIBRO (SOLO ADMIN) ─────────
if ($metodo == 'DELETE') {

    if ($rol != 'admin') {
        echo json_encode(['ok' => false, 'error' => 'Solo los administradores pueden eliminar libros']);
        exit();
    }

    $jsonRecibido = file_get_contents('php://input');
    $datos = json_decode($jsonRecibido, true);
    $id = isset($datos['id']) ? intval($datos['id']) : 0;

    if ($id == 0) {
        echo json_encode(['ok' => false, 'error' => 'ID no válido']);
        exit();
    }

    // Borramos el libro definitivamente de la base de datos usando su ID
    $stmt = $conexion->prepare('DELETE FROM libros WHERE id = ?');
    $stmt->bind_param('i', $id);
    
    echo json_encode(['ok' => $stmt->execute()]);
    exit();
}
?>