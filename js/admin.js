// =============================================================================
// admin.js — Panel de administración (administracion.html)
//
// El administrador puede ver estadísticas, añadir libros, eliminarlos y buscar
// portadas en Google Books. La gestión de usuarios está en usuarios.js.
// =============================================================================

import { Libro } from "./objects/Libro.js";
import { ponerEstado } from "./poner-estado.js";

// Comprueba que hay sesión de administrador; si no, redirige
// Si no lo es, lo mando al login o al inicio según el caso
async function comprobarSesion() {
    let respuesta = await fetch('api/sesion.php');
    let sesion = await respuesta.json();

    if (!sesion.logueado) {
        window.location.href = 'login.html';
        return false;
    }
    if (sesion.rol != 'admin') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Pide los libros a la API, actualiza los contadores de arriba y pinta la lista
async function cargarLibros() {
    let respuesta = await fetch('api/libros.php');
    let libros = await respuesta.json();

    // Cuento cuántos hay en cada estado para las estadísticas
    let total = libros.length;
    let prestados = 0;
    let disponibles = 0;

    for (let i = 0; i < libros.length; i++) {
        if (libros[i].estado == 'prestado') prestados++;
        if (libros[i].estado == 'disponible') disponibles++;
    }

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-prestados').textContent = prestados;
    document.getElementById('stat-disponibles').textContent = disponibles;

    // Limpio la lista y la repinto con los datos nuevos
    let contenedor = document.getElementById('lista-admin-libros');
    contenedor.innerHTML = '';

    for (let i = 0; i < libros.length; i++) {
        let libro = libros[i];

        let fila = document.createElement('div');
        fila.className = 'fila-admin-libro';

        // Si tiene imagen la muestro, si no pongo un emoji de libro
        let miniatura = '';
        if (libro.imagen_url) {
            miniatura = '<img src="' + libro.imagen_url + '" alt="Portada" class="admin-miniatura">';
        } else {
            miniatura = '<div class="admin-miniatura admin-miniatura--vacia">📚</div>';
        }

        let info = document.createElement('div');
        info.className = 'fila-admin-libro__info';
        info.innerHTML = miniatura +
            '<div>' +
                '<strong>' + libro.titulo + '</strong>' +
                '<span class="fila-admin-libro__autor">— ' + libro.autor + '</span>' +
                '<span class="badge badge--admin">' + libro.estado + '</span>' +
            '</div>';

        let btnEliminar = document.createElement('button');
        btnEliminar.className = 'boton boton-contorno';
        btnEliminar.classList.add('btn-eliminar-libro');
        btnEliminar.textContent = '🗑 Eliminar';

        // Guardo el id en una variable para que el closure lo capture bien
        let idLibro = libro.id;
        btnEliminar.addEventListener('click', function() {
            eliminarLibro(idLibro);
        });

        fila.appendChild(info);
        fila.appendChild(btnEliminar);
        contenedor.appendChild(fila);
    }
}

// Manda al servidor la orden de eliminar el libro con ese id
async function eliminarLibro(id) {
    if (!confirm('¿Seguro que quieres eliminar este libro?')) return;

    let respuesta = await fetch('api/libros.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
    });

    let resultado = await respuesta.json();

    if (resultado.ok) {
        cargarLibros(); // recargo la lista para que desaparezca
    } else {
        alert('Error al eliminar: ' + resultado.error);
    }
}

// Busca en Google Books la portada y sinopsis del libro que está escribiendo el admin
async function buscarEnGoogleBooks() {
    let titulo = document.getElementById('titulo').value;
    let autor  = document.getElementById('autor').value;
    let msg    = document.querySelector('[data-admin-form="msg"]');

    if (titulo == '') {
        ponerEstado(msg, 'Escribe el título primero.', 'warn');
        return;
    }

    let query = encodeURIComponent(titulo + ' ' + autor);
    let url   = 'https://www.googleapis.com/books/v1/volumes?q=' + query + '&maxResults=1&langRestrict=es';

    let respuesta = await fetch(url);
    let datos     = await respuesta.json();

    if (datos.totalItems > 0) {
        let info = datos.items[0].volumeInfo;

        let portada = '';
        if (info.imageLinks) {
            portada = info.imageLinks.thumbnail.replace('http://', 'https://');
        }

        let descripcion = '';
        if (info.description) {
            descripcion = info.description.substring(0, 500);
        }

        // Meto la URL de la portada en el campo del formulario
        document.getElementById('gb-imagen-url').value = portada;

        // Solo relleno la sinopsis si el admin no ha escrito nada todavía
        const textareaSinopsis = document.getElementById('sinopsis-manual');
        if (textareaSinopsis && textareaSinopsis.value.trim() === '' && descripcion) {
            textareaSinopsis.value = descripcion;
        }

        // Muestro la preview de la portada si la encontré
        if (portada) {
            let previewWrap = document.querySelector('[data-preview="wrap"]');
            let previewImg  = document.querySelector('[data-preview="img"]');
            previewImg.src  = portada;
            previewWrap.hidden = false;
        }

        ponerEstado(msg, '✅ Portada cargada desde Google Books.', 'ok');
    } else {
        ponerEstado(msg, '⚠️ No se encontró el libro. Puedes añadirlo sin portada o pegar la URL manualmente.', 'warn');
    }
}

// Recoge los datos del formulario y los manda a la API para crear el libro
async function guardarLibro(evento) {
    evento.preventDefault();

    let titulo      = document.getElementById('titulo').value;
    let autor       = document.getElementById('autor').value;
    let estado      = document.getElementById('estado').value;
    let imagenUrl   = document.getElementById('gb-imagen-url').value;
    let descripcion = document.getElementById('sinopsis-manual').value.trim();
    let msg         = document.querySelector('[data-admin-form="msg"]');

    if (titulo == '' || autor == '') {
        ponerEstado(msg, 'Título y autor son obligatorios.', 'error');
        return;
    }

    let respuesta = await fetch('api/libros.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            titulo:      titulo,
            autor:       autor,
            estado:      estado,
            imagen_url:  imagenUrl,
            descripcion: descripcion
        })
    });

    let resultado = await respuesta.json();

    if (resultado.ok) {
        ponerEstado(msg, '✅ Libro añadido correctamente.', 'ok');

        // Espero un momento para que el admin vea el mensaje y luego cierro el modal
        setTimeout(function() {
            document.querySelector('[data-modal="nuevo-libro"]').hidden = true;
            document.querySelector('[data-admin-form="form"]').reset();
            document.getElementById('gb-imagen-url').value = '';
            const wrap = document.querySelector('[data-preview="wrap"]');
            if (wrap) wrap.hidden = true;
            cargarLibros();
        }, 800);
    } else {
        ponerEstado(msg, '❌ Error: ' + resultado.error, 'error');
    }
}

// Arranca el panel cuando carga la página
async function iniciar() {
    let sesionOk = await comprobarSesion();
    if (!sesionOk) return;

    // Abrir y cerrar el modal de nuevo libro
    document.querySelector('[data-modal-open="nuevo-libro"]').addEventListener('click', function() {
        document.querySelector('[data-modal="nuevo-libro"]').hidden = false;
    });

    document.querySelector('[data-modal-close="nuevo-libro"]').addEventListener('click', function() {
        document.querySelector('[data-modal="nuevo-libro"]').hidden = true;
    });

    document.getElementById('btn-google-books').addEventListener('click', buscarEnGoogleBooks);

    document.querySelector('[data-admin-form="form"]').addEventListener('submit', guardarLibro);

    // El botón de volver al inicio lleva a index.html
    document.getElementById('btn-logout').addEventListener('click', function() {
        window.location.href = 'index.html';
    });

    cargarLibros();
}

document.addEventListener('DOMContentLoaded', iniciar);
