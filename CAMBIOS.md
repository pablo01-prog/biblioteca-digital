# Listado de cambios realizados tras el feedback

Fecha: Junio 2026  
Proyecto: Biblioteca Digital  

---

## 1. Google Books — Error 429 y llamadas repetidas

**Archivos modificados:** `js/app.js`, `js/prestamos.js`

- Añadida una variable `cachePortadas` que guarda los resultados de Google Books para no volver a llamar a la API si ya se buscó ese libro antes.
- Añadido control del código HTTP 429: si Google Books devuelve ese error, se muestra la imagen por defecto sin romper la aplicación.
- Añadido `try/catch` en las llamadas a Google Books para que si no hay conexión a internet la app siga funcionando con la imagen por defecto.

---

## 2. Base de datos — MyISAM a InnoDB con claves foráneas

**Archivo modificado:** `biblioteca.sql`

- Todas las tablas cambiadas de `ENGINE=MyISAM` a `ENGINE=InnoDB`.
- Añadidas claves foráneas reales (`FOREIGN KEY ... REFERENCES`) con `ON DELETE CASCADE` en:
  - `historial_prestamos` → `libros` y `usuarios`
  - `resenas` → `libros` y `usuarios`
  - `notas_privadas` → `libros` y `usuarios`
  - `preferencias` → `usuarios`

---

## 3. Diseño — Unificación entre index.html y mis-libros.html

**Archivo modificado:** `mis-libros.html`

- Cambiada la fuente de `Cormorant Garamond + DM Sans` (distinta a index.html) por `Inter + Playfair Display` (igual que el resto de páginas).

---

## 4. Corrección de bugs (ya realizados antes del feedback)

**Archivos modificados:** `login.html`, `administracion.html`, `js/admin.js`

- Ruta `images/` corregida a `imagenes/` en login.html y administracion.html.
- Ruta `JS/` en mayúsculas corregida a `js/` en administracion.html.
- `admin.js` reescrito para usar los selectores correctos del HTML (`data-modal-open`, `data-modal-close`).
- Typo `szºtyle` corregido a `style` en administracion.html (causaba que las estadísticas siempre mostraran 0).
- Botón "Volver al Inicio" corregido para redirigir a `index.html`.

---

## 5. Documentación añadida

**Archivos nuevos:**

- `README.md` — instrucciones de instalación y ejecución.
- `docs/base_de_datos.md` — documentación de tablas, campos y relaciones.
- `docs/pruebas_realizacion.md` — pruebas con datos de entrada, resultado esperado, resultado obtenido e incidencias.
- `docs/prueba_usuario.sql` — script SQL para crear usuario de prueba.
- `api/registro.php` — endpoint de registro de nuevos usuarios.
- `registro.html` — página de registro.
- `js/auth/registro.js` — lógica del formulario de registro.

---

## 6. Flip card en el catálogo (js/app.js, global.css)

- Las tarjetas del catálogo ahora se giran al hacer clic mostrando la sinopsis en la cara trasera
- La cara trasera tiene fondo blanco con borde burdeos, igual que la delantera
- Si el libro no tiene sinopsis en la BD, intenta obtenerla de Google Books y la guarda para no volver a pedirla

## 7. Sinopsis guardadas en la BD para evitar sobrecarga de Google Books (api/libros.php)

- El endpoint PUT de libros acepta ahora el parámetro guardar_gb para guardar portada y sinopsis sin cambiar el estado del libro
- Se añadió el script api/rellenar_sinopsis.php para rellenar todas las sinopsis de golpe (uso único, ejecutar como admin)
- Se añadió docs/sinopsis.sql con las sinopsis de los 20 libros para importar directamente sin depender de Google Books

## 8. Validación de preferencias de lectura (api/preferencias.php, js/prestamos.js, mis-libros.html)

- El servidor ahora valida que el género y autor escritos existan en el catálogo real antes de guardarlos
- Si no coinciden con ningún libro, se guardan como null en lugar de texto libre
- Los inputs muestran sugerencias desplegables (datalist) con los géneros y autores reales del catálogo
- Se añadió mensaje de feedback visual al guardar preferencias

## 9. Campo de sinopsis manual en el panel de administración (administracion.html, js/admin.js)

- Al añadir un libro, el admin puede escribir la sinopsis a mano
- El botón de Google Books rellena automáticamente la sinopsis solo si el textarea está vacío
- Al cerrar el modal el formulario se resetea completamente


# Listado de cambios realizados tras el feedback (Control de API)

Fecha: Junio 2026  
Proyecto: Biblioteca Digital  

---

## 10. Panel de Administración — Gestión del Error HTTP 429 y Control de Concurrencia

**Archivos modificados:** `js/admin.js` (o `admin.js` según tu estructura)

- **Mecanismo de control de concurrencia (Candado de UI):** Se ha modificado la función `buscarEnGoogleBooks` para capturar y deshabilitar el botón de búsqueda (`#btn-google-books`) inmediatamente después de hacer clic. Esto impide físicamente que el administrador envíe peticiones asíncronas en ráfaga por impaciencia, eliminando la causa principal del bloqueo por spam.
- **Arquitectura defensiva de errores con `try/catch`:** Se ha reestructurado el flujo para evaluar explícitamente el estado de la respuesta HTTP (`!respuesta.ok`). En caso de recibir una denegación de servicio de Google (como el error `429 Too Many Requests`), el script captura la excepción real y la muestra de forma dinámica en la interfaz a través del contenedor de mensajes (`msg-error`), evitando alertas genéricas que camuflen el origen del fallo.
- **Garantía de estado mediante bloque `finally`:** Se ha implementado un bloque crítico de finalización que se ejecuta obligatoriamente tanto si la petición finaliza con éxito como si es rechazada por el servidor o por un corte de red. En este bloque se reactiva el botón de la interfaz de usuario y se restaura su texto original de forma segura.
- **Saneamiento y optimización de la Query String:** Se ha refinado la construcción de la URL utilizando `encodeURIComponent()` y aplicando una condición limpia para concatenar el nombre del autor. Esto evita el envío de espacios en blanco huérfanos al final de la cadena de consulta que entorpezcan la indexación en los servidores de Google Books.