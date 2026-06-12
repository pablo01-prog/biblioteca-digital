// admin.js
// Controla el panel de administración (administracion.html)
// Desde aquí el admin puede ver estadísticas, añadir libros, eliminarlos y gestionar usuarios

import { Libro } from "./objects/Libro.js";

// 🔒 Cache global para evitar llamadas repetidas a Google Books
const cachePortadas = {};

// Antes de hacer nada compruebo que el usuario es admin
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
        btnEliminar.addEventListener('click', function () {
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
// 🎯 Mejorado con: cache de portadas, control de errores 429, mejor manejo de red
async function buscarEnGoogleBooks(evento) {
    // Evitamos cualquier comportamiento extraño si el botón está dentro de un formulario
    if (evento) evento.preventDefault();

    let titulo = document.getElementById('titulo').value.trim();
    let autor  = document.getElementById('autor').value.trim();
    let msg    = document.querySelector('[data-admin-form="msg"]');
    let boton  = document.getElementById('btn-google-books');

    if (titulo == '') {
        msg.textContent = 'Escribe el título primero.';
        msg.className = 'msg-warn';
        return;
    }

    try {
        // 🔒 Deshabilitamos el botón para evitar clics repetidos
        if (boton) {
            boton.disabled = true;
            boton.textContent = '🔍 Buscando...';
        }

        msg.textContent = '🔍 Conectando con Google Books...';
        msg.className = 'msg-info';

        // Creamos una clave de cache combinando título + autor
        let cacheKey = `${titulo}|${autor}`;

        // 💾 Si ya buscamos este libro antes, usamos el cache
        if (cachePortadas[cacheKey]) {
            console.log('📦 Usando cache para:', cacheKey);
            aplicarResultadosGoogle(cachePortadas[cacheKey], msg);
            if (boton) {
                boton.disabled = false;
                boton.textContent = '🔍 Obtener portada y sinopsis de Google Books';
            }
            return;
        }

        // Construimos la query de manera limpia
        let query = encodeURIComponent(titulo + (autor ? ' ' + autor : ''));
        
        // 🛠️ Para producción, añade tu API Key: &key=TU_API_KEY
        let url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&langRestrict=es`;

        // Timeout de 8 segundos para evitar esperas infinitas
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        let respuesta = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        // 🔴 Control de error 429 (Rate Limited) y otros errores HTTP
        if (respuesta.status === 429) {
            msg.textContent = '⚠️ Límite de Google Books alcanzado. Intenta de nuevo en unos minutos.';
            msg.className = 'msg-warn';
            console.warn('Error 429: Rate limit de Google Books');
            return;
        }

        if (!respuesta.ok) {
            throw new Error(`Google Books respondió con código ${respuesta.status}`);
        }

        let datos = await respuesta.json();

        // Guardamos el resultado en cache
        cachePortadas[cacheKey] = datos;

        // Aplicamos los resultados
        aplicarResultadosGoogle(datos, msg);

    } catch (error) {
        console.error("Error en Google Books:", error);
        
        // Diferenciamos el tipo de error para el usuario
        if (error.name === 'AbortError') {
            msg.textContent = '⏱️ Timeout: Google Books tardó demasiado. Intenta de nuevo.';
        } else if (error.message.includes('Failed to fetch')) {
            msg.textContent = '❌ Sin conexión a internet o Google Books no responde.';
        } else {
            msg.textContent = '❌ Error: ' + error.message;
        }
        msg.className = 'msg-error';
    } finally {
        // 🔓 Siempre reactivamos el botón al terminar
        if (boton) {
            boton.disabled = false;
            boton.textContent = '🔍 Obtener portada y sinopsis de Google Books';
        }
    }
}

// Función auxiliar para aplicar los resultados de Google Books
function aplicarResultadosGoogle(datos, msg) {
    try {
        if (datos.totalItems > 0) {
            let info = datos.items[0].volumeInfo;

            let portada = '';
            if (info.imageLinks) {
                let urlImagen = info.imageLinks.thumbnail || info.imageLinks.smallThumbnail || '';
                portada = urlImagen.replace('http://', 'https://');
            }

            let descripcion = info.description ? info.description.substring(0, 500) : '';

            // Rellenamos la URL de portada
            document.getElementById('gb-imagen-url').value = portada;

            // Solo rellenamos sinopsis si está vacía
            const textareaSinopsis = document.getElementById('sinopsis-manual');
            if (textareaSinopsis && textareaSinopsis.value.trim() === '' && descripcion) {
                textareaSinopsis.value = descripcion;
                
                const contadorSinopsis = document.getElementById('sinopsis-count');
                if (contadorSinopsis) {
                    contadorSinopsis.textContent = descripcion.length;
                }
            }

            // Mostramos la preview de la portada
            if (portada) {
                let previewWrap = document.querySelector('[data-preview="wrap"]');
                let previewImg  = document.querySelector('[data-preview="img"]');
                if (previewWrap && previewImg) {
                    previewImg.src = portada;
                    previewWrap.hidden = false;
                }
            }

            msg.textContent = '✅ Portada cargada desde Google Books.';
            msg.className = 'msg-ok';
        } else {
            msg.textContent = '⚠️ No se encontró el libro. Puedes añadirlo sin portada o pegar la URL manualmente.';
            msg.className = 'msg-warn';
        }
    } catch (error) {
        console.error('Error procesando datos de Google Books:', error);
        msg.textContent = '⚠️ Error al procesar los datos. Intenta de nuevo.';
        msg.className = 'msg-warn';
    }
}

// Recoge los datos del formulario y los manda a la API para crear el libro
async function guardarLibro(evento) {
    evento.preventDefault();

    let titulo = document.getElementById('titulo').value;
    let autor = document.getElementById('autor').value;
    let estado = document.getElementById('estado').value;
    let imagenUrl = document.getElementById('gb-imagen-url').value;
    let descripcion = document.getElementById('sinopsis-manual').value.trim();
    let msg = document.querySelector('[data-admin-form="msg"]');

    if (titulo == '' || autor == '') {
        msg.textContent = 'Título y autor son obligatorios.';
        msg.className = 'msg-error';
        return;
    }

    let respuesta = await fetch('api/libros.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            titulo: titulo,
            autor: autor,
            estado: estado,
            imagen_url: imagenUrl,
            descripcion: descripcion
        })
    });

    let resultado = await respuesta.json();

    if (resultado.ok) {
        msg.textContent = '✅ Libro añadido correctamente.';
        msg.className = 'msg-ok';

        // Espero un momento para que el admin vea el mensaje y luego cierro el modal
        setTimeout(function () {
            document.querySelector('[data-modal="nuevo-libro"]').hidden = true;
            document.querySelector('[data-admin-form="form"]').reset();
            document.getElementById('gb-imagen-url').value = '';

            // Reseteamos el contador de la sinopsis a 0
            const contadorSinopsis = document.getElementById('sinopsis-count');
            if (contadorSinopsis) contadorSinopsis.textContent = '0';

            const wrap = document.querySelector('[data-preview="wrap"]');
            if (wrap) wrap.hidden = true;
            cargarLibros();
        }, 800);
    } else {
        msg.textContent = '❌ Error: ' + resultado.error;
        msg.className = 'msg-error';
    }
}

// Arranca el panel cuando carga la página
async function iniciar() {
    let sesionOk = await comprobarSesion();
    if (!sesionOk) return;

    // Abrir y cerrar el modal de nuevo libro
    document.querySelector('[data-modal-open="nuevo-libro"]').addEventListener('click', function () {
        document.querySelector('[data-modal=\"nuevo-libro\"]').hidden = false;
    });

    document.querySelector('[data-modal-close=\"nuevo-libro\"]').addEventListener('click', function () {
        document.querySelector('[data-modal=\"nuevo-libro\"]').hidden = true;
    });

    document.getElementById('btn-google-books').addEventListener('click', buscarEnGoogleBooks);

    // Contador de caracteres del textarea de sinopsis
    const textareaSinopsis = document.getElementById('sinopsis-manual');
    const contadorSinopsis = document.getElementById('sinopsis-count');
    if (textareaSinopsis && contadorSinopsis) {
        textareaSinopsis.addEventListener('input', function () {
            contadorSinopsis.textContent = textareaSinopsis.value.length;
        });
    }

    document.querySelector('[data-admin-form="form"]').addEventListener('submit', guardarLibro);

    // El botón de volver al inicio lleva a index.html
    document.getElementById('btn-logout').addEventListener('click', function () {
        window.location.href = 'index.html';
    });

    cargarLibros();
}

document.addEventListener('DOMContentLoaded', iniciar);