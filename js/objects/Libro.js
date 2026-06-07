// ============================================================
//  Libro.js — Clase que representa un libro de la biblioteca
//  Se usa para estructurar los datos que vienen del servidor
// ============================================================

export class Libro {

    // El constructor se ejecuta al crear un nuevo objeto Libro
    constructor(id, titulo, autor, estado) {
        this.id     = id;      // Número identificador único en la base de datos
        this.titulo = titulo;  // Título del libro
        this.autor  = autor;   // Nombre del autor
        this.estado = estado;  // Estado actual: 'disponible' o 'prestado'
    }
}
