// ============================================================
//  admin.js — Panel de administración de libros
//  Gestiona el CRUD de libros y protege la página con sesión
// ============================================================

import { Libro } from "./objects/Libro.js";

// ── Función: comprobar si hay sesión de administrador ────────
// Si no hay sesión o el usuario no es admin, redirige
async function comprobarSesion() {

    // Pedimos al servidor el estado de la sesión actual
    var respuesta = await fetch('api/sesion.php', { cache: 'no-store' });
    var sesion    = await respuesta.json();

    // Si no está logueado, mandamos al login
    if (!sesion.logueado) {
        window.location.href = 'login.html';
        return false;
    }

    // Si está logueado pero no es admin, mandamos al inicio
    if (sesion.rol !== 'admin') {
        window.location.href = 'index.html';
        return false;
    }

    // Todo correcto
    return true;
}

// ── Función: mostrar el formulario de nuevo libro ────────────
function mostrarFormulario() {
    var modal = document.querySelector('[data-modal="nuevo-libro"]');
    if (modal) modal.hidden = false;
}

// ── Función: ocultar el formulario de nuevo libro ────────────
function ocultarFormulario() {
    var modal = document.querySelector('[data-modal="nuevo-libro"]');
    if (modal) modal.hidden = true;
}

// ── Función: cargar y mostrar la lista de libros ─────────────
async function cargarLibros() {

    var contenedor = document.querySelector('#lista-admin-libros');
    if (!contenedor) return;

    // Pedimos los libros al servidor
    var respuesta = await fetch('api/libros.php', { cache: 'no-store' });
    var libros    = await respuesta.json();

    // Actualizamos los contadores del panel
    var totalEl       = document.querySelector('#stat-total');
    var prestadosEl   = document.querySelector('#stat-prestados');
    var disponiblesEl = document.querySelector('#stat-disponibles');

    if (totalEl)       totalEl.textContent       = libros.length;
    if (prestadosEl)   prestadosEl.textContent   = libros.filter(function(l) { return l.estado === 'prestado'; }).length;
    if (disponiblesEl) disponiblesEl.textContent = libros.filter(function(l) { return l.estado === 'disponible'; }).length;

    // Vaciamos la lista antes de repintarla
    contenedor.innerHTML = "";

    // Creamos una fila por cada libro
    libros.forEach(function(libro) {

        // Creamos el contenedor de la fila
        var fila = document.createElement("div");
        fila.className = "tarjeta-libro";
        fila.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:10px; border:1px solid #eee;";

        // Información del libro
        var info = document.createElement("div");
        info.innerHTML = "<strong>" + libro.titulo + "</strong> — " + libro.autor +
                         " <span class='badge' style='margin-left:10px;'>" + libro.estado + "</span>";

        // Botón eliminar — usamos addEventListener en lugar de onclick
        var btnEliminar = document.createElement("button");
        btnEliminar.className = "boton boton-contorno";
        btnEliminar.style.cssText = "font-size:0.85rem; padding:6px 16px;";
        btnEliminar.textContent = "🗑 Eliminar";

        // Al hacer clic en eliminar, llamamos a la función con el id del libro
        btnEliminar.addEventListener("click", function() {
            eliminarLibro(libro.id);
        });

        fila.appendChild(info);
        fila.appendChild(btnEliminar);
        contenedor.appendChild(fila);
    });
}

// ── Función: añadir un libro nuevo ───────────────────────────
async function anadirLibro() {

    // Recogemos los valores del formulario
    var titulo = document.querySelector("#titulo").value.trim();
    var autor  = document.querySelector("#autor").value.trim();
    var estado = document.querySelector("#estado").value;
    var msgEl  = document.querySelector('[data-admin-form="msg"]');

    // Comprobamos que los campos obligatorios no estén vacíos
    if (!titulo || !autor) {
        if (msgEl) { msgEl.textContent = "Por favor, rellena todos los campos."; msgEl.style.color = "red"; }
        return;
    }

    // Enviamos los datos al servidor con método POST
    var respuesta = await fetch('api/libros.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ titulo: titulo, autor: autor, estado: estado })
    });

    var resultado = await respuesta.json();

    // Si el servidor confirma que fue bien, actualizamos la lista
    if (resultado.ok) {
        if (msgEl) { msgEl.textContent = "✅ Libro añadido correctamente."; msgEl.style.color = "green"; }
        setTimeout(function() {
            ocultarFormulario();
            cargarLibros();
        }, 800);
    } else {
        if (msgEl) { msgEl.textContent = "❌ Error: " + resultado.error; msgEl.style.color = "red"; }
    }
}

// ── Función: eliminar un libro ───────────────────────────────
async function eliminarLibro(id) {

    // Pedimos confirmación antes de borrar
    if (!confirm("¿Seguro que quieres eliminar este libro?")) return;

    // Enviamos la petición de borrado al servidor con método DELETE
    var respuesta = await fetch('api/libros.php', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: id })
    });

    var resultado = await respuesta.json();

    // Si fue bien, recargamos la lista
    if (resultado.ok) {
        cargarLibros();
    } else {
        alert("Error al eliminar: " + resultado.error);
    }
}

// ── Función principal del panel ──────────────────────────────
async function iniciarAdmin() {

    // Primero comprobamos que el usuario es administrador
    var sesionValida = await comprobarSesion();
    if (!sesionValida) return; // Si no, paramos aquí

    // Referencias a los botones del HTML
    var btnAbrirModal  = document.querySelector('[data-modal-open="nuevo-libro"]');
    var btnCerrarModal = document.querySelector('[data-modal-close="nuevo-libro"]');
    var btnLogout      = document.querySelector("#btn-logout");
    var formulario     = document.querySelector('[data-admin-form="form"]');

    // Asignamos los eventos a cada botón
    if (btnAbrirModal)  btnAbrirModal.addEventListener("click", mostrarFormulario);
    if (btnCerrarModal) btnCerrarModal.addEventListener("click", ocultarFormulario);

    // El botón de logout redirige al endpoint que cierra la sesión en el servidor
    if (btnLogout) {
        btnLogout.addEventListener("click", function() {
            window.location.href = 'api/logout.php';
        });
    }

    // Cuando se envía el formulario de nuevo libro
    if (formulario) {
        formulario.addEventListener("submit", function(evento) {
            evento.preventDefault(); // Evitamos que recargue la página
            anadirLibro();
        });
    }

    // Cargamos los libros al iniciar
    cargarLibros();
}

// Esperamos a que el HTML esté listo
document.addEventListener("DOMContentLoaded", iniciarAdmin);