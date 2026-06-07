// =============================================================================
// app.js — Lógica de la página principal (index.html)
//
// Entrada:  ninguna (se ejecuta al cargar el DOM).
// Salida:   pinta el catálogo de libros, filtros, reseñas y banner de preferencias.
// =============================================================================

// Guardamos aquí las portadas ya buscadas en Google Books (clave: "título|autor")
const cachePortadas = {};

// -----------------------------------------------------------------------------
// buscarDatosGoogleBooks(titulo, autor)
// Entrada: título y autor del libro (texto).
// Salida:  { portada: url o null, descripcion: texto o null }
// Pide portada y sinopsis a Google Books. Si falla, devuelve null sin romper la página.
// -----------------------------------------------------------------------------
async function buscarDatosGoogleBooks(titulo, autor) {

    const clave = titulo + '|' + autor;

    if (cachePortadas[clave] !== undefined) {
        return cachePortadas[clave];
    }

    try {
        const busqueda = encodeURIComponent(titulo + ' ' + autor);
        const url = 'https://www.googleapis.com/books/v1/volumes?q=' + busqueda + '&maxResults=1';
        const respuesta = await fetch(url);

        if (respuesta.status === 429 || !respuesta.ok) {
            cachePortadas[clave] = { portada: null, descripcion: null };
            return cachePortadas[clave];
        }

        const datos = await respuesta.json();

        if (datos.totalItems > 0) {
            const info = datos.items[0].volumeInfo;
            let portada = null;

            if (info.imageLinks && info.imageLinks.thumbnail) {
                portada = info.imageLinks.thumbnail.replace('http://', 'https://');
            }

            let descripcion = null;
            if (info.description) {
                descripcion = info.description.substring(0, 200) + '…';
            }

            cachePortadas[clave] = { portada: portada, descripcion: descripcion };
            return cachePortadas[clave];
        }

    } catch (error) {
        console.warn('Google Books no disponible:', error.message);
    }

    cachePortadas[clave] = { portada: null, descripcion: null };
    return cachePortadas[clave];
}

// Espera unos milisegundos entre peticiones para no saturar Google Books
function esperar(milisegundos) {
    return new Promise(function(resolver) {
        setTimeout(resolver, milisegundos);
    });
}

// -----------------------------------------------------------------------------
// obtenerResenas(libroId)
// Entrada: id numérico del libro.
// Salida:  array de reseñas (o array vacío si hay error).
// -----------------------------------------------------------------------------
async function obtenerResenas(libroId) {
    try {
        const respuesta = await fetch('api/resenas.php?libro_id=' + libroId);
        if (!respuesta.ok) {
            return [];
        }
        return await respuesta.json();
    } catch (error) {
        return [];
    }
}

// Calcula la media de estrellas de un array de reseñas (ej: "4.3")
function mediaEstrellas(resenas) {
    if (!resenas || resenas.length === 0) {
        return null;
    }

    let suma = 0;
    for (let i = 0; i < resenas.length; i++) {
        suma = suma + parseInt(resenas[i].estrellas);
    }

    return (suma / resenas.length).toFixed(1);
}

// -----------------------------------------------------------------------------
// abrirModalResenas(titulo, resenas)
// Entrada: título del libro y lista de reseñas.
// Salida:  muestra el modal en pantalla (no devuelve nada).
// Se ejecuta al pulsar "Ver reseñas" en una tarjeta.
// -----------------------------------------------------------------------------
function abrirModalResenas(titulo, resenas) {
    const modal = document.getElementById('modal-resenas');
    if (!modal) {
        return;
    }

    modal.querySelector('#modal-resenas-titulo').textContent = 'Reseñas de "' + titulo + '"';

    const lista = modal.querySelector('#modal-resenas-lista');
    lista.innerHTML = '';

    if (resenas.length === 0) {
        lista.innerHTML = '<p class="resena-sin-datos">Todavía no hay reseñas.</p>';
    } else {
        for (let i = 0; i < resenas.length; i++) {
            const resena = resenas[i];
            const numEstrellas = parseInt(resena.estrellas);
            const estrellasLlenas = '★'.repeat(numEstrellas);
            const estrellasVacias = '☆'.repeat(5 - numEstrellas);
            const fecha = new Date(resena.created_at).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            const nombreUsuario = resena.email.split('@')[0];

            const item = document.createElement('div');
            item.className = 'resena-item';

            let htmlComentario = '<p class="resena-item__sin-comentario">Sin comentario escrito.</p>';
            if (resena.comentario) {
                htmlComentario = '<p class="resena-item__comentario">' + resena.comentario + '</p>';
            }

            item.innerHTML =
                '<div class="resena-item__cabecera">' +
                    '<span class="resena-item__estrellas">' + estrellasLlenas + estrellasVacias + '</span>' +
                    '<span class="resena-item__meta">' + nombreUsuario + ' · ' + fecha + '</span>' +
                '</div>' +
                htmlComentario;

            lista.appendChild(item);
        }
    }

    modal.hidden = false;
}

// -----------------------------------------------------------------------------
// crearTarjetaLibro(libro)
// Entrada: objeto libro de la API.
// Salida:  elemento HTML de la tarjeta (sin portada ni reseñas cargadas aún).
// Crea la estructura visual: cara frontal (portada) y cara trasera (sinopsis).
// -----------------------------------------------------------------------------
function crearTarjetaLibro(libro) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-libro';

    let claseBadge = 'badge badge--disponible';
    if (libro.estado === 'prestado') {
        claseBadge = 'badge badge--prestado';
    }

    let imagenInicial = 'imagenes/portada_libro.png';
    if (libro.imagen_url) {
        imagenInicial = libro.imagen_url;
    }

    let htmlGenero = '';
    if (libro.genero) {
        htmlGenero = '<p class="tarjeta-libro__genero">' + libro.genero + '</p>';
    }

    tarjeta.innerHTML =
        '<div class="tarjeta-libro__flip-inner">' +
            '<div class="tarjeta-libro__cara-front">' +
                '<div class="tarjeta-libro__portada-wrap">' +
                    '<img class="tarjeta-libro__portada" src="' + imagenInicial + '"' +
                         ' alt="Portada de ' + libro.titulo + '" loading="lazy"' +
                         ' onerror="this.src=\'imagenes/portada_libro.png\'">' +
                '</div>' +
                '<div class="tarjeta-libro__cuerpo">' +
                    '<span class="' + claseBadge + '">' + libro.estado + '</span>' +
                    '<h3 class="tarjeta-libro__titulo">' + libro.titulo + '</h3>' +
                    '<p class="tarjeta-libro__autor">' + libro.autor + '</p>' +
                    htmlGenero +
                    '<div class="resenas-wrap"></div>' +
                '</div>' +
            '</div>' +
            '<div class="tarjeta-libro__cara-back">' +
                '<span class="tarjeta-libro__back-badge">' + libro.estado + '</span>' +
                '<p class="tarjeta-libro__back-titulo">' + libro.titulo + '</p>' +
                '<p class="tarjeta-libro__back-autor">— ' + libro.autor + '</p>' +
                '<p class="tarjeta-libro__desc tarjeta-libro__back-sinopsis"></p>' +
                '<p class="tarjeta-libro__back-hint">Haz clic para volver</p>' +
            '</div>' +
        '</div>';

    // Al hacer clic en la tarjeta, se gira para ver la sinopsis
    tarjeta.addEventListener('click', function() {
        tarjeta.classList.toggle('flipped');
    });

    return tarjeta;
}

// Rellena la portada y la sinopsis de una tarjeta ya creada
async function cargarPortadaYSinopsis(tarjeta, libro) {
    const faltaPortada = !libro.imagen_url;
    const faltaSinopsis = !libro.descripcion;

    let datosGoogle = { portada: null, descripcion: null };
    if (faltaPortada || faltaSinopsis) {
        datosGoogle = await buscarDatosGoogleBooks(libro.titulo, libro.autor);
    }

    let urlPortada = libro.imagen_url;
    if (!urlPortada) {
        urlPortada = datosGoogle.portada;
    }
    if (urlPortada) {
        const imagen = tarjeta.querySelector('.tarjeta-libro__portada');
        if (imagen) {
            imagen.src = urlPortada;
        }
    }

    let textoSinopsis = libro.descripcion;
    if (!textoSinopsis) {
        textoSinopsis = datosGoogle.descripcion;
    }

    const elementoSinopsis = tarjeta.querySelector('.tarjeta-libro__back-sinopsis');
    if (elementoSinopsis) {
        if (textoSinopsis) {
            elementoSinopsis.textContent = textoSinopsis;
        } else {
            elementoSinopsis.textContent = 'Sin descripción disponible.';
            elementoSinopsis.classList.add('tarjeta-libro__back-sin-desc');
        }
    }

    // Si Google Books aportó datos nuevos, los guardamos en la base de datos
    const hayPortadaNueva = faltaPortada && datosGoogle.portada;
    const haySinopsisNueva = faltaSinopsis && datosGoogle.descripcion;
    if (hayPortadaNueva || haySinopsisNueva) {
        fetch('api/libros.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: libro.id,
                guardar_gb: true,
                imagen_url: datosGoogle.portada || libro.imagen_url || '',
                descripcion: datosGoogle.descripcion || libro.descripcion || ''
            })
        }).catch(function() {});
    }
}

// Muestra la media de estrellas y el botón "Ver reseñas" en la tarjeta
async function cargarResenasEnTarjeta(tarjeta, libro) {
    const resenas = await obtenerResenas(libro.id);
    const media = mediaEstrellas(resenas);

    if (!media) {
        return;
    }

    const contenedor = tarjeta.querySelector('.resenas-wrap');
    const textoResenas = resenas.length === 1 ? 'reseña' : 'reseñas';

    contenedor.innerHTML =
        '<div class="resenas-wrap__fila">' +
            '<span class="resenas-wrap__media">★ ' + media + '</span>' +
            '<span class="resenas-wrap__cuenta">(' + resenas.length + ' ' + textoResenas + ')</span>' +
            '<button class="btn-ver-resenas">Ver reseñas</button>' +
        '</div>';

    const tituloLibro = libro.titulo;
    const listaResenas = resenas;

    contenedor.querySelector('.btn-ver-resenas').addEventListener('click', function() {
        abrirModalResenas(tituloLibro, listaResenas);
    });
}

// -----------------------------------------------------------------------------
// mostrarLibros(lista, contenedor)
// Entrada: array de libros y el div donde pintarlos.
// Salida:  vacía y rellena el contenedor con tarjetas.
// -----------------------------------------------------------------------------
async function mostrarLibros(lista, contenedor) {
    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = '';

    if (lista.length === 0) {
        contenedor.innerHTML = '<p class="catalogo-vacio">No hay libros que coincidan.</p>';
        return;
    }

    const tarjetas = [];

    for (let i = 0; i < lista.length; i++) {
        const tarjeta = crearTarjetaLibro(lista[i]);
        contenedor.appendChild(tarjeta);
        tarjetas.push(tarjeta);
    }

    for (let i = 0; i < lista.length; i++) {
        await cargarPortadaYSinopsis(tarjetas[i], lista[i]);
        await cargarResenasEnTarjeta(tarjetas[i], lista[i]);
        await esperar(150);
    }
}

// Filtra libros por título, autor y género (texto que escribe el usuario)
function filtrarLibros(titulo, autor, genero, datosLibros) {
    const tituloBusqueda = titulo.toLowerCase().trim();
    const autorBusqueda = autor.toLowerCase().trim();
    const generoBusqueda = genero.toLowerCase().trim();

    const resultado = [];

    for (let i = 0; i < datosLibros.length; i++) {
        const libro = datosLibros[i];
        let coincideTitulo = true;
        let coincideAutor = true;
        let coincideGenero = true;

        if (tituloBusqueda) {
            coincideTitulo = libro.titulo.toLowerCase().includes(tituloBusqueda);
        }
        if (autorBusqueda) {
            coincideAutor = libro.autor.toLowerCase().includes(autorBusqueda);
        }
        if (generoBusqueda) {
            coincideGenero = libro.genero && libro.genero.toLowerCase().includes(generoBusqueda);
        }

        if (coincideTitulo && coincideAutor && coincideGenero) {
            resultado.push(libro);
        }
    }

    return resultado;
}

// Ordena los libros poniendo primero los del género/autor favorito del usuario
function ordenarPorPreferencias(datosLibros, prefs) {
    if (!prefs || (!prefs.genero && !prefs.autor)) {
        return datosLibros;
    }

    const copia = datosLibros.slice();

    copia.sort(function(libroA, libroB) {
        let puntosA = 0;
        let puntosB = 0;

        if (prefs.genero && libroA.genero && libroA.genero.toLowerCase().includes(prefs.genero.toLowerCase())) {
            puntosA++;
        }
        if (prefs.autor && libroA.autor && libroA.autor.toLowerCase().includes(prefs.autor.toLowerCase())) {
            puntosA++;
        }
        if (prefs.genero && libroB.genero && libroB.genero.toLowerCase().includes(prefs.genero.toLowerCase())) {
            puntosB++;
        }
        if (prefs.autor && libroB.autor && libroB.autor.toLowerCase().includes(prefs.autor.toLowerCase())) {
            puntosB++;
        }

        return puntosB - puntosA;
    });

    return copia;
}

// Rellena el desplegable de géneros con los que existen en el catálogo
function poblarGeneros(datosLibros, selector) {
    if (!selector) {
        return;
    }

    const generos = [];

    for (let i = 0; i < datosLibros.length; i++) {
        const genero = datosLibros[i].genero;
        if (genero && genero.trim() && generos.indexOf(genero) === -1) {
            generos.push(genero);
        }
    }

    generos.sort();

    for (let i = 0; i < generos.length; i++) {
        const opcion = document.createElement('option');
        opcion.value = generos[i];
        opcion.textContent = generos[i];
        selector.appendChild(opcion);
    }
}

// Configura los botones del modal de reseñas (cerrar al pulsar X o fuera)
function configurarModalResenas() {
    const modal = document.getElementById('modal-resenas');
    const btnCerrar = document.getElementById('cerrar-modal-resenas');

    if (btnCerrar) {
        btnCerrar.addEventListener('click', function() {
            modal.hidden = true;
        });
    }

    if (modal) {
        modal.addEventListener('click', function(evento) {
            if (evento.target === modal) {
                modal.hidden = true;
            }
        });
    }
}

// Muestra u oculta botones de la cabecera según si hay sesión iniciada
async function configurarNavegacionSesion() {
    const prefsPorDefecto = { genero: '', autor: '' };

    try {
        const resSesion = await fetch('api/sesion.php', { cache: 'no-store' });
        const sesion = await resSesion.json();

        if (!sesion.logueado) {
            return prefsPorDefecto;
        }

        const btnLogin = document.querySelector('#btn-login');
        const btnAcceso = document.querySelector('#btn-acceso-personal');
        const btnLogout = document.querySelector('#btn-logout-index');

        if (btnLogin) {
            btnLogin.hidden = true;
        }

        if (btnAcceso) {
            btnAcceso.hidden = false;
            if (sesion.rol === 'admin') {
                btnAcceso.href = 'administracion.html';
                btnAcceso.textContent = 'Panel Admin';
            } else {
                btnAcceso.href = 'mis-libros.html';
                btnAcceso.textContent = 'Mis Libros';
            }
        }

        if (btnLogout) {
            btnLogout.hidden = false;
        }

        const resPrefs = await fetch('api/preferencias.php', { cache: 'no-store' });
        const prefs = await resPrefs.json();

        if (prefs.genero || prefs.autor) {
            const banner = document.getElementById('banner-recomendaciones');
            const nombreEl = document.getElementById('banner-nombre');
            const prefsEl = document.getElementById('banner-prefs-texto');

            if (banner && nombreEl && prefsEl) {
                const partes = [];

                if (prefs.genero) {
                    partes.push('género: ' + prefs.genero);
                }
                if (prefs.autor) {
                    partes.push('autor: ' + prefs.autor);
                }

                nombreEl.textContent = sesion.email.split('@')[0];
                prefsEl.textContent = partes.join(' · ');
                banner.hidden = false;
            }
        }

        return prefs;

    } catch (error) {
        return prefsPorDefecto;
    }
}

// -----------------------------------------------------------------------------
// iniciarPaginaPrincipal()
// Función principal: se ejecuta cuando el DOM está listo.
// Carga libros, configura filtros y la navegación según la sesión.
// -----------------------------------------------------------------------------
async function iniciarPaginaPrincipal() {
    const contenedor = document.querySelector('[data-grid="destacados"]');
    const inputTitulo = document.querySelector('[data-filter="titulo"]');
    const inputAutor = document.querySelector('[data-filter="autor"]');
    const selectGenero = document.querySelector('[data-filter="genero"]');
    const formulario = document.querySelector('[data-search="form"]');

    configurarModalResenas();

    const prefs = await configurarNavegacionSesion();

    const respuesta = await fetch('api/libros.php', { cache: 'no-store' });
    const datosLibros = await respuesta.json();

    poblarGeneros(datosLibros, selectGenero);
    mostrarLibros(ordenarPorPreferencias(datosLibros, prefs), contenedor);

    // Al pulsar "Buscar" se filtran los libros
    if (formulario) {
        formulario.addEventListener('submit', function(evento) {
            evento.preventDefault();

            let titulo = '';
            let autor = '';
            let genero = '';

            if (inputTitulo) {
                titulo = inputTitulo.value;
            }
            if (inputAutor) {
                autor = inputAutor.value;
            }
            if (selectGenero) {
                genero = selectGenero.value;
            }

            const filtrados = filtrarLibros(titulo, autor, genero, datosLibros);
            mostrarLibros(ordenarPorPreferencias(filtrados, prefs), contenedor);
        });
    }

    // Al cambiar el género en el desplegable, filtramos sin pulsar Buscar
    if (selectGenero) {
        selectGenero.addEventListener('change', function() {
            const titulo = inputTitulo ? inputTitulo.value : '';
            const autor = inputAutor ? inputAutor.value : '';
            const filtrados = filtrarLibros(titulo, autor, selectGenero.value, datosLibros);
            mostrarLibros(ordenarPorPreferencias(filtrados, prefs), contenedor);
        });
    }
}

document.addEventListener('DOMContentLoaded', iniciarPaginaPrincipal);
