# Documento de Pruebas de Realización

Proyecto: Biblioteca Digital  
Autor: Pablo González Hernández  
Fecha: Junio 2026  

---

## Cómo se han realizado las pruebas

Las pruebas se han ejecutado manualmente en el entorno local (WAMP) usando el navegador Chrome.  
Para cada prueba se indica: los datos de entrada utilizados, el resultado que se esperaba, el resultado real obtenido, y si hubo alguna incidencia y cómo se corrigió.

---

## Pruebas de autenticación

| ID | Acción | Datos de entrada | Resultado esperado | Resultado obtenido | Incidencia / Corrección |
|----|--------|-----------------|-------------------|-------------------|------------------------|
| A-01 | Registro correcto | email: prueba@test.com / pass: Test1234 | Cuenta creada, redirige a mis-libros.html | ✅ Funciona | — |
| A-02 | Registro con email ya existente | email: admin@biblioteca.com | Mensaje "Ya existe una cuenta con ese correo" | ✅ Funciona | — |
| A-03 | Registro con contraseña corta | pass: 123 | Mensaje de error de validación | ✅ Funciona | — |
| A-04 | Registro con contraseñas distintas | pass1: Test1234 / pass2: Test5678 | Mensaje "Las contraseñas no coinciden" | ✅ Funciona | — |
| A-05 | Login correcto como usuario | email: prueba@test.com / pass: Test1234 | Sesión iniciada, redirige a index.html | ✅ Funciona | — |
| A-06 | Login correcto como admin | email: admin@biblioteca.com / pass: (contraseña admin) | Sesión iniciada con rol admin | ✅ Funciona | — |
| A-07 | Login con contraseña incorrecta | pass: incorrecta | Mensaje de error, no inicia sesión | ✅ Funciona | — |
| A-08 | Acceso a administracion.html sin sesión | URL directa sin estar logueado | Redirige a login.html | ✅ Funciona | — |
| A-09 | Acceso a administracion.html como usuario normal | Usuario con rol 'usuario' | Redirige a index.html | ✅ Funciona | — |

---

## Pruebas del catálogo (index.html)

| ID | Acción | Datos de entrada | Resultado esperado | Resultado obtenido | Incidencia / Corrección |
|----|--------|-----------------|-------------------|-------------------|------------------------|
| C-01 | Cargar catálogo | — | Se muestran todos los libros de la BD | ✅ Funciona | — |
| C-02 | Filtrar por título | "Dune" | Solo aparece el libro Dune | ✅ Funciona | — |
| C-03 | Filtrar por autor | "Orwell" | Aparecen 1984 y Rebelión en la granja | ✅ Funciona | — |
| C-04 | Filtrar por género | "Terror" | Solo aparecen libros de Terror | ✅ Funciona | — |
| C-05 | Filtro sin resultados | título: "zzzzz" | Mensaje "No hay libros que coincidan" | ✅ Funciona | — |
| C-06 | Portada cargada desde Google Books | libro: "1984" | Se muestra la portada oficial | ✅ Funciona | — |
| C-07 | Google Books devuelve 429 | muchas peticiones seguidas | Se muestra imagen por defecto, no rompe la app | ✅ Funciona tras corrección | **Incidencia:** antes la app se quedaba colgada. **Corrección:** se añadió manejo del status 429 y cache de peticiones |
| C-08 | Sin conexión a internet | desconectar red | Se muestra imagen por defecto, la app sigue funcionando | ✅ Funciona tras corrección | **Incidencia:** antes daba error de red sin capturar. **Corrección:** se añadió try/catch en buscarDatosGoogleBooks |
| C-09 | Ver reseñas de un libro | libro con reseñas | Se abre el modal con las reseñas | ✅ Funciona | — |

---

## Pruebas de préstamos

| ID | Acción | Datos de entrada | Resultado esperado | Resultado obtenido | Incidencia / Corrección |
|----|--------|-----------------|-------------------|-------------------|------------------------|
| P-01 | Pedir libro disponible | libro: "1984" (disponible) | Estado cambia a "prestado", aparece en Mis Libros | ✅ Funciona | — |
| P-02 | Intentar pedir libro ya prestado | libro: "Harry Potter" (prestado) | Botón deshabilitado o mensaje de error | ✅ Funciona | — |
| P-03 | Devolver libro prestado | libro: "Dune" (prestado por el usuario) | Estado vuelve a "disponible" | ✅ Funciona | — |
| P-04 | Ver libros prestados en Mis Libros | usuario con 2 libros prestados | Aparecen los 2 libros prestados | ✅ Funciona | — |
| P-05 | Pedir préstamo sin sesión iniciada | fetch directo a api/libros.php PUT | Respuesta: ok:false / error: "Debes iniciar sesión" | ✅ Funciona | — |

---

## Pruebas de reseñas y notas

| ID | Acción | Datos de entrada | Resultado esperado | Resultado obtenido | Incidencia / Corrección |
|----|--------|-----------------|-------------------|-------------------|------------------------|
| R-01 | Escribir reseña con estrellas | libro: "Dune", 4 estrellas, comentario | Reseña guardada y visible | ✅ Funciona | — |
| R-02 | Reseña sin comentario | solo estrellas | Se guarda sin comentario | ✅ Funciona | — |
| N-01 | Guardar nota privada | "Voy por el capítulo 3" | Nota guardada en BD | ✅ Funciona | — |
| N-02 | La nota no la ve otro usuario | usuario diferente | No aparece la nota del otro usuario | ✅ Funciona | — |

---

## Pruebas del panel de administración

| ID | Acción | Datos de entrada | Resultado esperado | Resultado obtenido | Incidencia / Corrección |
|----|--------|-----------------|-------------------|-------------------|------------------------|
| AD-01 | Abrir modal Nuevo Libro | pulsar botón "+ Nuevo Libro" | Se abre el modal con el formulario | ✅ Funciona tras corrección | **Incidencia:** el modal no se abría porque el JS buscaba IDs que no existían. **Corrección:** se reescribió admin.js usando data-modal-open |
| AD-02 | Añadir libro con título y autor | título: "El Principito", autor: "Saint-Exupéry" | Libro aparece en el catálogo | ✅ Funciona | — |
| AD-03 | Añadir libro sin título | dejar título vacío | Mensaje de error, no se guarda | ✅ Funciona | — |
| AD-04 | Buscar portada en Google Books | título: "Dune" | Portada cargada en el formulario | ✅ Funciona | — |
| AD-05 | Eliminar libro | pulsar "🗑 Eliminar" en un libro | Libro desaparece del catálogo | ✅ Funciona | — |
| AD-06 | Estadísticas correctas | catálogo con 20 libros, 4 prestados | Total:20, Prestados:4, Disponibles:16 | ✅ Funciona tras corrección | **Incidencia:** los contadores siempre mostraban 0. **Corrección:** había un typo `szºtyle` en el HTML |
| AD-07 | Botón Volver al Inicio | pulsar el botón | Redirige a index.html | ✅ Funciona tras corrección | **Incidencia:** redirigía a logout.php. **Corrección:** se cambió el listener en admin.js |

---

## Pruebas de base de datos

| ID | Prueba | Resultado |
|----|--------|-----------|
| BD-01 | Todas las tablas usan InnoDB | ✅ Verificado en phpMyAdmin |
| BD-02 | Las claves foráneas están definidas | ✅ historial_prestamos, resenas, notas_privadas y preferencias tienen FK |
| BD-03 | Al eliminar un usuario se eliminan sus préstamos, notas y reseñas (ON DELETE CASCADE) | ✅ Verificado |
| BD-04 | No se puede insertar un préstamo con un libro_id inexistente | ✅ La FK lo impide |
| BD-05 | Un usuario solo puede tener una nota por libro (UNIQUE KEY) | ✅ La BD devuelve error si se intenta duplicar |

---

## Errores encontrados y corregidos (resumen)

| Error | Causa | Corrección |
|-------|-------|------------|
| Modal de Nuevo Libro no abría | JS usaba IDs inexistentes | Se reescribió admin.js con selectores correctos |
| Estadísticas siempre a 0 | Typo `szºtyle` en HTML | Corregido el atributo style |
| Volver al Inicio no funcionaba | Listener apuntaba a logout.php | Corregido a index.html |
| Música no sonaba en login ni admin | Ruta `images/` incorrecta | Corregido a `imagenes/` |
| Scripts JS no cargaban en admin | Ruta `JS/` en mayúsculas | Corregido a `js/` |
| Google Books se colgaba con 429 | Sin manejo del código de error | Añadido control de 429 y cache |
| App rompía sin conexión | Sin try/catch en fetch a Google Books | Añadido try/catch |
| Tablas MyISAM sin integridad | Motor por defecto de phpMyAdmin | Cambiado a InnoDB con claves foráneas |
