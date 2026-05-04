// ============================================================
//  prestamos.js — Página "Mis Libros" (mis-libros.html)
//  Muestra solo los préstamos del usuario logueado
//  y el catálogo de libros disponibles para coger
// ============================================================

// ── Función principal: carga toda la página ──────────────────
async function cargarPanelUsuario() {

    // ── 1. Comprobamos si hay sesión activa ──────────────────
    // Preguntamos al servidor quién está logueado ahora mismo
    var respuestaSesion = await fetch('api/sesion.php', { cache: 'no-store' });
    var sesion          = await respuestaSesion.json();

    // Si no hay sesión activa, mandamos al usuario al login
    if (!sesion.logueado) {
        window.location.href = 'login.html';
        return;
    }

    // Mostramos el email del usuario en el header de la página
    var tituloHeader = document.querySelector('nav h1');
    if (tituloHeader && !document.getElementById('email-usuario')) {
        var spanEmail = document.createElement('span');
        spanEmail.id = 'email-usuario';
        spanEmail.style.cssText = 'font-size:0.5em; display:block; color:#ffd700; font-weight:400;';
        spanEmail.textContent = sesion.email;
        tituloHeader.appendChild(spanEmail);
    }

    // ── 2. Cargamos todos los libros desde la BD ─────────────
    // cache: 'no-store' obliga al navegador a pedir datos frescos siempre
    var respuestaLibros = await fetch('api/libros.php', { cache: 'no-store' });
    var todosLosLibros  = await respuestaLibros.json();

    // ── 3. Mis préstamos ─────────────────────────────────────
    // Filtramos los libros que están prestados Y que tienen el id del usuario actual
    // Así Celia no ve los libros de Pablo y viceversa
    var misPrestamos = todosLosLibros.filter(function(libro) {
        return libro.estado === 'prestado' &&
               String(libro.usuario_id) === String(sesion.id);
    });

    var contenedorMisPrestamos = document.querySelector('#mis-prestamos');
    if (contenedorMisPrestamos) {

        contenedorMisPrestamos.innerHTML = '';

        if (misPrestamos.length === 0) {
            contenedorMisPrestamos.innerHTML = '<p>No tienes préstamos activos.</p>';
        } else {
            misPrestamos.forEach(function(libro) {

                // Creamos la tarjeta del libro prestado
                var tarjeta = document.createElement('div');
                tarjeta.className = 'tarjeta-libro';
                tarjeta.style.borderLeft = '5px solid #800020';
                tarjeta.innerHTML = '<h3>' + libro.titulo + '</h3><p><em>' + libro.autor + '</em></p>';

                // Botón para devolver el libro
                var btnDevolver = document.createElement('button');
                btnDevolver.className = 'btn btn--outline';
                btnDevolver.textContent = 'Devolver Libro';

                // Guardamos el id en una variable local para el evento
                var idLibro = libro.id;
                btnDevolver.addEventListener('click', function() {
                    cambiarEstadoLibro(idLibro, 'disponible');
                });

                tarjeta.appendChild(btnDevolver);
                contenedorMisPrestamos.appendChild(tarjeta);
            });
        }
    }

    // ── 4. Libros disponibles ────────────────────────────────
    // Filtramos los libros que no están prestados por nadie
    var librosDisponibles = todosLosLibros.filter(function(libro) {
        return libro.estado === 'disponible';
    });

    var contenedorDisponibles = document.querySelector('#catalogo-prestamos');
    if (contenedorDisponibles) {

        contenedorDisponibles.innerHTML = '';

        if (librosDisponibles.length === 0) {
            contenedorDisponibles.innerHTML = '<p>No hay libros disponibles en este momento.</p>';
        } else {
            librosDisponibles.forEach(function(libro) {

                // Creamos la tarjeta del libro disponible
                var tarjeta = document.createElement('div');
                tarjeta.className = 'tarjeta-libro';
                tarjeta.innerHTML = '<h3>' + libro.titulo + '</h3><p><em>' + libro.autor + '</em></p>';

                // Botón para coger el libro prestado
                var btnCoger = document.createElement('button');
                btnCoger.className = 'btn btn--primary';
                btnCoger.textContent = 'Coger Prestado';

                var idLibro = libro.id;
                btnCoger.addEventListener('click', function() {
                    cambiarEstadoLibro(idLibro, 'prestado');
                });

                tarjeta.appendChild(btnCoger);
                contenedorDisponibles.appendChild(tarjeta);
            });
        }
    }
}

// ── Función: cambiar el estado de un libro ───────────────────
// Comunica al servidor si el libro pasa a "prestado" o "disponible"
async function cambiarEstadoLibro(idLibro, nuevoEstado) {

    var respuesta = await fetch('api/libros.php', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: idLibro, estado: nuevoEstado })
    });

    var resultado = await respuesta.json();

    // Si el servidor confirmó el cambio, recargamos la página
    if (resultado.ok) {
        cargarPanelUsuario();
    } else {
        alert('Error al actualizar el libro: ' + (resultado.error || 'Error desconocido'));
    }
}

// ── Inicialización: asignamos eventos a los botones ──────────
document.addEventListener('DOMContentLoaded', function() {

    // Botón cerrar sesión: llama al servidor para destruir la sesión PHP
    var btnCerrarSesion = document.querySelector('#btn-logout');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', function() {
            window.location.href = 'api/logout.php';
        });
    }

    // Cargamos el panel al arrancar
    cargarPanelUsuario();
});