// ============================================================
//  app.js — Página principal (index.html)
//  Carga el catálogo de libros y gestiona el buscador
// ============================================================

import { Libro } from "./objects/Libro.js";

// ── Función: pintar libros en pantalla ───────────────────────
// Recibe una lista de libros y un contenedor HTML donde mostrarlos
function mostrarLibros(listaDeLibros, contenedor) {

    // Si no existe el contenedor, salimos para evitar errores
    if (!contenedor) return;

    // Borramos lo que hubiera antes
    contenedor.innerHTML = "";

    // Si la lista está vacía, mostramos un mensaje
    if (listaDeLibros.length === 0) {
        contenedor.innerHTML = "<p>No hay libros que coincidan con la búsqueda.</p>";
        return;
    }

    // Recorremos cada libro y creamos su tarjeta HTML
    listaDeLibros.forEach(function(libro) {

        // Creamos un div para la tarjeta
        var tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-libro";

        // Rellenamos la tarjeta con los datos del libro
        tarjeta.innerHTML =
            "<h3>" + libro.titulo + "</h3>" +
            "<p><strong>Autor:</strong> " + libro.autor + "</p>" +
            "<p><span class='badge'>" + libro.estado + "</span></p>" +
            "<img src='images/portada_libro.png' alt='Portada' style='width:100%; border-radius:10px;'>";

        // Añadimos la tarjeta al contenedor
        contenedor.appendChild(tarjeta);
    });
}

// ── Función: filtrar libros por texto ────────────────────────
// Devuelve solo los libros cuyo título o autor contienen el texto buscado
function buscarLibros(textoBuscado, todosLosLibros) {

    // Convertimos a minúsculas para que la búsqueda no distinga mayúsculas
    var busqueda = textoBuscado.toLowerCase();

    // filter() devuelve un nuevo array solo con los libros que cumplen la condición
    return todosLosLibros.filter(function(libro) {
        return libro.titulo.toLowerCase().includes(busqueda) ||
               libro.autor.toLowerCase().includes(busqueda);
    });
}

// ── Función principal ────────────────────────────────────────
// Se ejecuta cuando la página está completamente cargada
async function iniciarPaginaPrincipal() {

    // Obtenemos referencias a los elementos del HTML
    var contenedorLibros   = document.querySelector('[data-grid="destacados"]');
    var formularioBusqueda = document.querySelector('[data-search="form"]');
    var campoBusqueda      = document.querySelector('[data-search="input"]');

    // Pedimos los libros al servidor mediante fetch
    // await espera a que el servidor responda antes de continuar
    var respuesta   = await fetch('api/libros.php', { cache: 'no-store' });
    var datosLibros = await respuesta.json();

    // Convertimos cada dato recibido en un objeto de nuestra clase Libro
    var listaLibros = datosLibros.map(function(l) {
        return new Libro(l.id, l.titulo, l.autor, l.estado);
    });

    // Mostramos todos los libros nada más cargar la página
    mostrarLibros(listaLibros, contenedorLibros);

    // Cuando el usuario envía el formulario de búsqueda
    if (formularioBusqueda) {
        formularioBusqueda.addEventListener("submit", function(evento) {

            // Evitamos que el formulario recargue la página
            evento.preventDefault();

            // Filtramos la lista y mostramos solo los resultados
            var resultados = buscarLibros(campoBusqueda.value, listaLibros);
            mostrarLibros(resultados, contenedorLibros);
        });
    }
}

// Esperamos a que el HTML esté listo antes de ejecutar nada
document.addEventListener("DOMContentLoaded", iniciarPaginaPrincipal);