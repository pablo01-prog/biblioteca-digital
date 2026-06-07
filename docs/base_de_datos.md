# Documentación de la Base de Datos

Base de datos: `biblioteca`  
Motor: MySQL 8  
Codificación: utf8mb4 (soporta tildes, ñ y emojis)

---

## Cómo importarla

1. Abre `http://localhost/phpmyadmin`
2. Crea una base de datos llamada `biblioteca`
3. Ve a la pestaña **Importar**
4. Selecciona el archivo `biblioteca.sql` que está en la raíz del proyecto
5. Pulsa **Importar**

El archivo SQL ya incluye la estructura de todas las tablas y datos de ejemplo.

---

## Tablas

### `usuarios`

Guarda las cuentas de los usuarios de la aplicación.

| Campo           | Tipo                      | Descripción                              |
|-----------------|---------------------------|------------------------------------------|
| `id`            | INT, AUTO_INCREMENT, PK   | Identificador único                      |
| `email`         | VARCHAR(191), UNIQUE       | Correo del usuario (sirve como nombre)   |
| `password_hash` | VARCHAR(255)              | Contraseña cifrada con bcrypt            |
| `rol`           | ENUM('admin', 'usuario')  | Nivel de acceso                          |
| `created_at`    | TIMESTAMP                 | Fecha de registro (se pone solo)         |

---

### `libros`

Catálogo de libros disponibles en la biblioteca.

| Campo        | Tipo                             | Descripción                                      |
|--------------|----------------------------------|--------------------------------------------------|
| `id`         | INT, AUTO_INCREMENT, PK          | Identificador único                              |
| `titulo`     | VARCHAR(255)                     | Título del libro                                 |
| `autor`      | VARCHAR(255)                     | Autor del libro                                  |
| `genero`     | VARCHAR(100)                     | Género literario                                 |
| `estado`     | ENUM('disponible', 'prestado')   | Si se puede pedir prestado o no                  |
| `imagen_url` | VARCHAR(500)                     | URL de la portada (viene de Google Books API)    |
| `descripcion`| TEXT                             | Descripción del libro (viene de Google Books)    |
| `created_at` | TIMESTAMP                        | Fecha en que se añadió                           |

---

### `historial_prestamos`

Registra qué usuario tiene (o tuvo) cada libro.

| Campo             | Tipo                    | Descripción                                           |
|-------------------|-------------------------|-------------------------------------------------------|
| `id`              | INT, AUTO_INCREMENT, PK | Identificador único                                   |
| `libro_id`        | INT, FK → libros        | Qué libro se prestó                                   |
| `usuario_id`      | INT, FK → usuarios      | A quién se le prestó                                  |
| `fecha_prestamo`  | DATETIME                | Cuándo se pidió (se pone solo)                        |
| `fecha_devolucion`| DATETIME                | Cuándo se devolvió. NULL = sigue prestado             |

---

### `resenas`

Valoraciones que los usuarios escriben sobre los libros.

| Campo        | Tipo                    | Descripción                        |
|--------------|-------------------------|------------------------------------|
| `id`         | INT, AUTO_INCREMENT, PK | Identificador único                |
| `libro_id`   | INT, FK → libros        | Libro que se valora                |
| `usuario_id` | INT, FK → usuarios      | Quién escribe la reseña            |
| `estrellas`  | TINYINT                 | Puntuación del 1 al 5              |
| `comentario` | TEXT                    | Texto de la reseña                 |
| `created_at` | DATETIME                | Fecha de la reseña                 |

---

### `notas_privadas`

Notas personales de cada usuario sobre un libro. Solo las ve él.

| Campo        | Tipo                    | Descripción                               |
|--------------|-------------------------|-------------------------------------------|
| `id`         | INT, AUTO_INCREMENT, PK | Identificador único                       |
| `usuario_id` | INT, FK → usuarios      | A quién pertenece la nota                 |
| `libro_id`   | INT, FK → libros        | Sobre qué libro es                        |
| `nota`       | TEXT                    | Contenido de la nota                      |

Tiene una clave única `(usuario_id, libro_id)` para que cada usuario solo pueda tener una nota por libro.

---

### `preferencias`

Guarda el género y autor favorito de cada usuario para personalizar el catálogo.

| Campo        | Tipo                    | Descripción                  |
|--------------|-------------------------|------------------------------|
| `usuario_id` | INT, PK, FK → usuarios  | A quién pertenece            |
| `genero`     | VARCHAR(100)            | Género literario favorito     |
| `autor`      | VARCHAR(100)            | Autor favorito                |

---

## Relaciones entre tablas

```
usuarios ──────────────────────────────────────────────┐
    │                                                   │
    ├──< historial_prestamos >──── libros              │
    ├──< resenas             >──── libros              │
    ├──< notas_privadas      >──── libros              │
    └──── preferencias                                  │
                                                        │
libros ─────────────────────────────────────────────────┘
```

- Un usuario puede tener muchos préstamos, reseñas y notas
- Un libro puede aparecer en muchos préstamos y reseñas
- Las preferencias y notas son de uno a uno (un usuario → un registro por libro)

---

## Seguridad

- Las contraseñas **nunca** se guardan en texto plano. Se usa `password_hash()` con bcrypt (PHP).
- La sesión se gestiona con `$_SESSION` en PHP. El frontend nunca decide si el usuario es admin.
- Cada endpoint PHP comprueba la sesión antes de hacer nada sensible.
- El archivo `conexion.php` usa el usuario `root` sin contraseña, que es el valor por defecto de XAMPP en local. En producción habría que cambiarlo.

---

## Usuarios de prueba

> ⚠️ Cuentas creadas solo para evaluación.

| Rol     | Email                  | Contraseña   |
|---------|------------------------|--------------|
| Admin   | admin@biblioteca.com   | Admin1234    |
| Usuario | prueba@biblioteca.com  | Usuario1234  |

Para crear el usuario de prueba puedes:
- Usar la página de **Registro** (`registro.html`)
- O importar el archivo `prueba_usuario.sql` que está en esta carpeta

---

## Datos de ejemplo

El archivo `biblioteca.sql` ya incluye:
- **20 libros** con distintos géneros y estados
- **1 usuario admin** y **2 usuarios normales**
- **4 préstamos** de ejemplo (2 activos, 2 devueltos)
- **1 reseña** de ejemplo
- **1 nota privada** de ejemplo
- **1 preferencia** de ejemplo
