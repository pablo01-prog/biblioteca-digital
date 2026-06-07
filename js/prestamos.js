import { ponerEstado } from "./poner-estado.js";

// =============================================================================
// prestamos.js — Lógica de la página "Mis Libros" (mis-libros.html)
//
// Permite al usuario: ver préstamos activos, pedir/devolver libros, guardar notas,
// escribir reseñas y configurar preferencias de lectura.
// =============================================================================

let LIBROS_POR_PAGINA = 6;
let paginaActual = 1;
let librosDisponiblesGlobal = [];

const cachePortadas = {};

// -----------------------------------------------------------------------------
// buscarPortada(titulo, autor)
// Entrada: título y autor.
// Salida:  URL de la portada o null si no se encuentra.
// -----------------------------------------------------------------------------
async function buscarPortada(titulo, autor) {
    const clave = titulo + '|' + autor;

    if (cachePortadas[clave] !== undefined) {
        return cachePortadas[clave];
    }

    try {
        const busqueda = encodeURIComponent(titulo + ' ' + autor);
        const url = 'https://www.googleapis.com/books/v1/volumes?q=' + busqueda + '&maxResults=1';
        const respuesta = await fetch(url);

        if (respuesta.status === 429 || !respuesta.ok) {
            cachePortadas[clave] = null;
            return null;
        }

        const datos = await respuesta.json();

        if (datos.totalItems > 0) {
            const info = datos.items[0].volumeInfo;
            let urlPortada = null;

            if (info.imageLinks && info.imageLinks.thumbnail) {
                urlPortada = info.imageLinks.thumbnail.replace('http://', 'https://');
            }

            cachePortadas[clave] = urlPortada;
            return urlPortada;
        }

    } catch (error) {
        console.warn('Google Books no disponible:', error.message);
    }

    cachePortadas[clave] = null;
    return null;
}

// Devuelve la URL de portada de un libro (BD, Google Books o imagen por defecto)
async function obtenerUrlPortada(libro) {
    if (libro.imagen_url) {
        return libro.imagen_url;
    }

    const portadaGoogle = await buscarPortada(libro.titulo, libro.autor);
    if (portadaGoogle) {
        return portadaGoogle;
    }

    return 'imagenes/portada_libro.png';
}

// -----------------------------------------------------------------------------
// cargarNota(libroId, contenedorNota)
// Entrada: id del libro y el div que contiene el textarea.
// Salida:  rellena el textarea con la nota guardada en la BD.
// -----------------------------------------------------------------------------
async function cargarNota(libroId, contenedorNota) {
    const respuesta = await fetch('api/notas.php?libro_id=' + libroId, { cache: 'no-store' });
    const datos = await respuesta.json();
    const textarea = contenedorNota.querySelector('textarea');

    if (textarea) {
        textarea.value = datos.nota || '';
    }
}

// -----------------------------------------------------------------------------
// guardarNota(libroId, texto, btnGuardar)
// Entrada: id del libro, texto de la nota y el botón pulsado.
// Salida:  envía la nota a la API y muestra mensaje en el botón.
// Se ejecuta al pulsar "Guardar nota".
// -----------------------------------------------------------------------------
async function guardarNota(libroId, texto, btnGuardar) {
    btnGuardar.textContent = 'Guardando…';
    btnGuardar.disabled = true;

    const respuesta = await fetch('api/notas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libro_id: libroId, nota: texto })
    });
    const resultado = await respuesta.json();

    if (resultado.ok) {
        btnGuardar.textContent = '✅ Guardado';
    } else {
        btnGuardar.textContent = '❌ Error';
    }

    setTimeout(function() {
        btnGuardar.textContent = '💾 Guardar nota';
        btnGuardar.disabled = false;
    }, 1500);
}

// Crea el formulario de estrellas y comentario para dejar una reseña
function crearFormularioResena(libroId, contenedor) {
    const wrap = document.createElement('div');
    wrap.className = 'resena-wrap';

    let htmlEstrellas = '';
    for (let i = 1; i <= 5; i++) {
        htmlEstrellas += '<button type="button" data-val="' + i + '" class="btn-estrella">★</button>';
    }

    wrap.innerHTML =
        '<p class="resena-label">⭐ Deja una reseña:</p>' +
        '<div class="estrellas-wrap" id="estrellas-' + libroId + '">' + htmlEstrellas + '</div>' +
        '<textarea placeholder="Escribe tu comentario (opcional)…" class="tarjeta-prestado__textarea" id="comentario-' + libroId + '"></textarea>' +
        '<button id="btn-resena-' + libroId + '" class="btn btn--outline btn-enviar-resena">Enviar reseña</button>' +
        '<p id="msg-resena-' + libroId + '" class="msg-resena"></p>';

    contenedor.appendChild(wrap);

    let estrellasSeleccionadas = 0;
    const botonesEstrella = wrap.querySelectorAll('#estrellas-' + libroId + ' button');

    for (let i = 0; i < botonesEstrella.length; i++) {
        botonesEstrella[i].addEventListener('click', function() {
            estrellasSeleccionadas = parseInt(botonesEstrella[i].getAttribute('data-val'));

            for (let j = 0; j < botonesEstrella.length; j++) {
                const valor = parseInt(botonesEstrella[j].getAttribute('data-val'));
                if (valor <= estrellasSeleccionadas) {
                    botonesEstrella[j].setAttribute('data-activa', 'si');
                } else {
                    botonesEstrella[j].removeAttribute('data-activa');
                }
            }
        });
    }

    const btnEnviar = wrap.querySelector('#btn-resena-' + libroId);

    btnEnviar.addEventListener('click', async function() {
        const msgEl = document.getElementById('msg-resena-' + libroId);

        if (estrellasSeleccionadas === 0) {
            ponerEstado(msgEl, 'Selecciona al menos una estrella.', 'warn');
            return;
        }

        const comentario = document.getElementById('comentario-' + libroId).value.trim();

        const respuesta = await fetch('api/resenas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                libro_id: libroId,
                estrellas: estrellasSeleccionadas,
                comentario: comentario
            })
        });
        const resultado = await respuesta.json();

        if (resultado.ok) {
            ponerEstado(msgEl, '✅ Reseña enviada. ¡Gracias!', 'ok');
            btnEnviar.disabled = true;
        } else {
            ponerEstado(msgEl, '❌ ' + (resultado.error || 'Error al enviar'), 'error');
        }
    });
}

// Tarjeta para un libro que el usuario tiene prestado (nota, devolver, reseña)
async function crearTarjetaPrestado(libro) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-libro tarjeta-prestado';

    const imgSrc = await obtenerUrlPortada(libro);

    const cabecera = document.createElement('div');
    cabecera.className = 'tarjeta-prestado__cabecera';
    cabecera.innerHTML =
        '<img src="' + imgSrc + '" alt="Portada" class="tarjeta-prestado__portada">' +
        '<div>' +
            '<h3 class="tarjeta-libro__titulo">' + libro.titulo + '</h3>' +
            '<p class="tarjeta-libro__autor">' + libro.autor + '</p>' +
        '</div>';
    tarjeta.appendChild(cabecera);

    const notaWrap = document.createElement('div');
    notaWrap.className = 'tarjeta-prestado__nota-wrap';
    notaWrap.innerHTML =
        '<p class="tarjeta-prestado__nota-label">📝 Mi nota privada:</p>' +
        '<textarea placeholder="Ej: Lo dejé a medias en el capítulo 5…" class="tarjeta-prestado__textarea"></textarea>' +
        '<div class="tarjeta-prestado__acciones">' +
            '<button class="btn btn--outline btn-accion-prestamo" id="btn-nota">💾 Guardar nota</button>' +
            '<button class="btn btn--outline btn-accion-prestamo" id="btn-devolver">↩ Devolver</button>' +
        '</div>';
    tarjeta.appendChild(notaWrap);

    await cargarNota(libro.id, notaWrap);

    const btnNota = notaWrap.querySelector('#btn-nota');
    btnNota.addEventListener('click', function() {
        const texto = notaWrap.querySelector('textarea').value;
        guardarNota(libro.id, texto, btnNota);
    });

    notaWrap.querySelector('#btn-devolver').addEventListener('click', function() {
        cambiarEstadoLibro(libro.id, 'disponible');
    });

    crearFormularioResena(libro.id, tarjeta);

    return tarjeta;
}

// Tarjeta para un libro disponible que se puede pedir prestado
async function crearTarjetaDisponible(libro) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-libro';

    const imgSrc = await obtenerUrlPortada(libro);

    let generoHtml = '';
    if (libro.genero) {
        generoHtml = '<p class="tarjeta-disponible__genero">' + libro.genero + '</p>';
    }

    tarjeta.innerHTML =
        '<img class="tarjeta-libro__portada tarjeta-libro__portada--pequena" src="' + imgSrc + '" alt="Portada">' +
        '<div class="tarjeta-libro__cuerpo">' +
            '<h3 class="tarjeta-libro__titulo">' + libro.titulo + '</h3>' +
            '<p class="tarjeta-libro__autor">' + libro.autor + '</p>' +
            generoHtml +
        '</div>';

    const btn = document.createElement('button');
    btn.className = 'btn btn--primary btn-accion-prestamo';
    btn.textContent = '📖 Coger prestado';
    btn.addEventListener('click', function() {
        cambiarEstadoLibro(libro.id, 'prestado');
    });

    tarjeta.querySelector('.tarjeta-libro__cuerpo').appendChild(btn);
    return tarjeta;
}

// Muestra una página del catálogo de libros disponibles
async function renderizarPagina(pagina) {
    paginaActual = pagina;
    const contenedor = document.getElementById('catalogo-prestamos');

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = '<p class="msg-lista-vacia">Cargando...</p>';

    const inicio = (pagina - 1) * LIBROS_POR_PAGINA;
    const fin = inicio + LIBROS_POR_PAGINA;
    const librosPagina = librosDisponiblesGlobal.slice(inicio, fin);

    contenedor.innerHTML = '';

    for (let i = 0; i < librosPagina.length; i++) {
        const tarjeta = await crearTarjetaDisponible(librosPagina[i]);
        contenedor.appendChild(tarjeta);
    }

    renderizarPaginacion();
}

// Pinta los botones 1, 2, 3… para cambiar de página
function renderizarPaginacion() {
    const totalPaginas = Math.ceil(librosDisponiblesGlobal.length / LIBROS_POR_PAGINA);
    const bloqueAnterior = document.getElementById('paginacion-disponibles');

    if (bloqueAnterior) {
        bloqueAnterior.remove();
    }

    if (totalPaginas <= 1) {
        return;
    }

    const wrap = document.createElement('div');
    wrap.id = 'paginacion-disponibles';
    wrap.className = 'paginacion';

    for (let p = 1; p <= totalPaginas; p++) {
        const btn = document.createElement('button');
        btn.textContent = p;

        btn.className = 'btn btn-pagina';
        if (p === paginaActual) {
            btn.setAttribute('data-activa', 'si');
        }

        btn.addEventListener('click', function() {
            renderizarPagina(p);
        });

        wrap.appendChild(btn);
    }

    document.getElementById('catalogo-prestamos').after(wrap);
}

// Filtra del catálogo los libros prestados por el usuario actual
function obtenerMisPrestamos(todosLosLibros, idUsuario) {
    const prestamos = [];

    for (let i = 0; i < todosLosLibros.length; i++) {
        const libro = todosLosLibros[i];
        if (libro.estado === 'prestado' && String(libro.usuario_id) === String(idUsuario)) {
            prestamos.push(libro);
        }
    }

    return prestamos;
}

// Filtra solo los libros con estado "disponible"
function obtenerLibrosDisponibles(todosLosLibros) {
    const disponibles = [];

    for (let i = 0; i < todosLosLibros.length; i++) {
        if (todosLosLibros[i].estado === 'disponible') {
            disponibles.push(todosLosLibros[i]);
        }
    }

    return disponibles;
}

// Extrae géneros únicos de una lista de libros (para el datalist)
function extraerGenerosUnicos(libros) {
    const generos = [];

    for (let i = 0; i < libros.length; i++) {
        const genero = libros[i].genero;
        if (genero && generos.indexOf(genero) === -1) {
            generos.push(genero);
        }
    }

    generos.sort();
    return generos;
}

// Extrae autores únicos de una lista de libros (para el datalist)
function extraerAutoresUnicos(libros) {
    const autores = [];

    for (let i = 0; i < libros.length; i++) {
        const autor = libros[i].autor;
        if (autor && autores.indexOf(autor) === -1) {
            autores.push(autor);
        }
    }

    autores.sort();
    return autores;
}

// -----------------------------------------------------------------------------
// cargarPanelUsuario()
// Función principal de la página: comprueba sesión y pinta préstamos y catálogo.
// -----------------------------------------------------------------------------
async function cargarPanelUsuario() {
    const resSesion = await fetch('api/sesion.php', { cache: 'no-store' });
    const sesion = await resSesion.json();

    if (!sesion.logueado) {
        window.location.href = 'login.html';
        return;
    }

    const msgBienvenida = document.getElementById('msg-bienvenida');
    if (msgBienvenida) {
        const nombre = sesion.email.split('@')[0];
        msgBienvenida.textContent = 'Bienvenido/a, ' + nombre + ' — aquí puedes gestionar tus libros prestados.';
    }

    const resPrefs = await fetch('api/preferencias.php', { cache: 'no-store' });
    const prefs = await resPrefs.json();
    mostrarPanelPreferencias(prefs);

    const resLibros = await fetch('api/libros.php', { cache: 'no-store' });
    const todosLosLibros = await resLibros.json();

    const misPrestamos = obtenerMisPrestamos(todosLosLibros, sesion.id);
    const contenedorPrestamos = document.getElementById('mis-prestamos');

    if (contenedorPrestamos) {
        contenedorPrestamos.innerHTML = '';

        if (misPrestamos.length === 0) {
            contenedorPrestamos.innerHTML = '<p class="msg-lista-vacia">No tienes préstamos activos.</p>';
        } else {
            for (let i = 0; i < misPrestamos.length; i++) {
                const tarjeta = await crearTarjetaPrestado(misPrestamos[i]);
                contenedorPrestamos.appendChild(tarjeta);
            }
        }
    }

    librosDisponiblesGlobal = obtenerLibrosDisponibles(todosLosLibros);
    const contenedorDisp = document.getElementById('catalogo-prestamos');

    if (contenedorDisp) {
        if (librosDisponiblesGlobal.length === 0) {
            contenedorDisp.innerHTML = '<p class="msg-lista-vacia">No hay libros disponibles.</p>';
        } else {
            renderizarPagina(1);
        }
    }
}

// Configura el panel de preferencias (género y autor favoritos)
async function mostrarPanelPreferencias(prefsActuales) {
    const panel = document.getElementById('panel-preferencias');
    if (!panel) {
        return;
    }

    const inputGenero = document.getElementById('pref-genero');
    const inputAutor = document.getElementById('pref-autor');

    if (inputGenero) {
        inputGenero.value = prefsActuales.genero || '';
    }
    if (inputAutor) {
        inputAutor.value = prefsActuales.autor || '';
    }

    const resLibros = await fetch('api/libros.php');
    const libros = await resLibros.json();
    const generos = extraerGenerosUnicos(libros);
    const autores = extraerAutoresUnicos(libros);

    const listaGeneros = document.getElementById('lista-generos');
    const listaAutores = document.getElementById('lista-autores');

    if (listaGeneros) {
        for (let i = 0; i < generos.length; i++) {
            const opt = document.createElement('option');
            opt.value = generos[i];
            listaGeneros.appendChild(opt);
        }
    }

    if (listaAutores) {
        for (let i = 0; i < autores.length; i++) {
            const opt = document.createElement('option');
            opt.value = autores[i];
            listaAutores.appendChild(opt);
        }
    }

    const btnGuardar = document.getElementById('btn-guardar-prefs');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async function() {
            const genero = inputGenero ? inputGenero.value.trim() : '';
            const autor = inputAutor ? inputAutor.value.trim() : '';
            const msg = document.getElementById('msg-preferencias');

            const respuesta = await fetch('api/preferencias.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ genero: genero, autor: autor })
            });
            const resultado = await respuesta.json();

            if (msg) {
                if (resultado.aviso) {
                    ponerEstado(msg, '⚠️ ' + resultado.aviso, 'info');
                } else if (resultado.ok) {
                    ponerEstado(msg, '✅ Preferencias guardadas correctamente.', 'ok');
                }

                setTimeout(function() {
                    ponerEstado(msg, '', '');
                }, 3000);
            }

            if (inputGenero) {
                inputGenero.value = resultado.genero || '';
            }
            if (inputAutor) {
                inputAutor.value = resultado.autor || '';
            }
        });
    }
}

// -----------------------------------------------------------------------------
// cambiarEstadoLibro(idLibro, nuevoEstado)
// Entrada: id del libro y "prestado" o "disponible".
// Salida:  llama a la API y recarga el panel si todo va bien.
// Se ejecuta al pulsar "Coger prestado" o "Devolver".
// -----------------------------------------------------------------------------
async function cambiarEstadoLibro(idLibro, nuevoEstado) {
    const respuesta = await fetch('api/libros.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idLibro, estado: nuevoEstado })
    });
    const resultado = await respuesta.json();

    if (resultado.ok) {
        cargarPanelUsuario();
    } else {
        alert('Error: ' + (resultado.error || 'Error desconocido'));
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function() {
            window.location.href = 'api/logout.php';
        });
    }
    cargarPanelUsuario();
});
