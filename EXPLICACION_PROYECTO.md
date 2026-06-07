# Explicación del Proyecto — Biblioteca Digital

---

## 1. ¿Qué es este proyecto?

Es una **biblioteca digital web** donde los usuarios pueden:

- Ver un catálogo público de libros con búsqueda y filtros.
- Registrarse e iniciar sesión.
- Pedir libros en préstamo y devolverlos.
- Escribir notas privadas y reseñas con estrellas.
- Configurar preferencias de lectura (género y autor favoritos).
- Los administradores gestionan libros y usuarios desde un panel propio.

**Tecnologías usadas:** HTML, CSS, JavaScript (sin frameworks), PHP y MySQL. Servidor local WAMP/XAMPP.

---

## 2. Estructura del proyecto

```
BibliotecaDigital/
├── index.html              → Catálogo público (página de inicio)
├── login.html              → Inicio de sesión
├── registro.html           → Alta de nuevos usuarios
├── mis-libros.html         → Zona privada del lector
├── administracion.html     → Panel del administrador
├── global.css              → Todos los estilos visuales
├── biblioteca.sql          → Script para crear la base de datos
│
├── api/                    → Backend PHP (responde en JSON)
│   ├── conexion.php        → Conexión a MySQL
│   ├── login.php           → Autenticación
│   ├── registro.php        → Crear cuenta
│   ├── logout.php          → Cerrar sesión
│   ├── sesion.php          → Consultar quién está logueado
│   ├── libros.php          → CRUD de libros + préstamos
│   ├── usuarios.php        → CRUD de usuarios (solo admin)
│   ├── resenas.php         → Leer y escribir reseñas
│   ├── notas.php           → Notas privadas por libro
│   └── preferencias.php    → Género/autor favoritos del usuario
│
├── js/                     → Lógica del navegador
│   ├── app.js              → Página principal (index.html)
│   ├── prestamos.js        → Página Mis Libros
│   ├── admin.js            → Gestión de libros (admin)
│   ├── usuarios.js         → Gestión de usuarios (admin)
│   ├── auth/
│   │   ├── login.js        → Formulario de login
│   │   └── registro.js     → Formulario de registro
|   |
│   └── objects/
│       └── Usuario.js      → Validación de email y contraseña
|       └── Libro.js        → Validación de libro
│
├── imagenes/               → Portadas por defecto y audio de fondo
└── docs/                   → Documentación y scripts SQL auxiliares
```

---

## 3. ¿Qué hace cada carpeta?

| Carpeta | Función |
|---------|---------|
| **Raíz (`/`)** | Páginas HTML que ve el usuario en el navegador |
| **`api/`** | Servidor PHP: recibe peticiones, consulta MySQL y devuelve JSON |
| **`js/`** | JavaScript del cliente: manipula el DOM y llama a la API con `fetch` |
| **`js/auth/`** | Scripts solo para login y registro |
| **`js/objects/`** | Clase `Usuario` y clase `Libro` para validar formularios |
| **`imagenes/`** | Recursos estáticos (portada por defecto, música) |
| **`docs/`** | Material de apoyo (pruebas, SQL extra, tambien las insercciones de sinopsis) |

---

## 4. Base de datos (MySQL)

La base de datos se llama **`biblioteca`**. Tablas principales:

| Tabla | Qué guarda |
|-------|------------|
| `usuarios` | Email, contraseña cifrada (bcrypt) y rol (`usuario` o `admin`) |
| `libros` | Título, autor, género, estado, portada y sinopsis |
| `historial_prestamos` | Quién tiene cada libro y fechas de préstamo/devolución |
| `notas_privadas` | Nota personal de cada usuario por libro |
| `resenas` | Puntuación (1-5 estrellas) y comentario público |
| `preferencias` | Género y autor favoritos de cada usuario |

---

## 5. Flujo completo de la aplicación

### 5.1 Visitante sin sesión

```
index.html → app.js → GET api/libros.php → muestra catálogo
                    → GET api/sesion.php  → muestra botón "Iniciar Sesión"
```

El visitante puede buscar libros, ver portadas, leer sinopsis (girando la tarjeta) y ver reseñas. No puede pedir préstamos.

### 5.2 Registro de usuario

```
registro.html → registro.js valida email/contraseña
             → POST api/registro.php
             → Crea usuario en BD + inicia sesión automáticamente
             → Redirige a mis-libros.html
```

### 5.3 Inicio de sesión

```
login.html → login.js valida campos
          → POST api/login.php
          → PHP comprueba email + password_verify()
          → Guarda datos en $_SESSION
          → Redirige a administracion.html (admin) o mis-libros.html (usuario)
```

### 5.4 Usuario logueado — Mis Libros

```
mis-libros.html → prestamos.js
               → GET api/sesion.php (si no hay sesión → login.html)
               → GET api/libros.php (catálogo completo)
               → Filtra en JS: mis préstamos vs disponibles
               → GET api/notas.php / POST para guardar notas
               → POST api/resenas.php para reseñas
               → PUT api/libros.php para prestar/devolver
```

### 5.5 Administrador

```
administracion.html → admin.js + usuarios.js
                   → Comprueban rol admin con api/sesion.php
                   → GET/POST/DELETE api/libros.php
                   → GET/POST/PUT/DELETE api/usuarios.php
                   → Google Books para buscar portadas al añadir libros
```

### 5.6 Cerrar sesión

```
Clic en "Cerrar Sesión" → api/logout.php
                       → Destruye $_SESSION
                       → Redirige a login.html
```

---

## 6. Archivos importantes explicados

### Frontend (HTML + JS)

| Archivo | Responsabilidad |
|---------|-----------------|
| `index.html` | Estructura del catálogo, filtros, modal de reseñas |
| `app.js` | Carga libros, filtros, Google Books, reseñas, preferencias |
| `mis-libros.html` | Secciones: preferencias, préstamos activos, catálogo disponible |
| `prestamos.js` | Préstamos, devoluciones, notas, reseñas, paginación |
| `administracion.html` | Panel con sidebar, estadísticas, modales de alta |
| `admin.js` | Lista de libros, estadísticas, alta/eliminación, Google Books |
| `usuarios.js` | Tabla de usuarios, alta y eliminación |
| `Usuario.js` | `validarEmail()` y `validarPassword()` con expresiones regulares |
| `global.css` | Diseño visual completo (colores, tarjetas, botones, modales) |

### Backend (PHP)

| Archivo | Métodos HTTP | Quién puede usarlo |
|---------|--------------|-------------------|
| `libros.php` | GET | Todos (público) |
| `libros.php` | POST, DELETE | Solo admin |
| `libros.php` | PUT | Usuarios logueados (prestar/devolver/guardar portada) |
| `usuarios.php` | Todos | Solo admin |
| `resenas.php` | GET | Todos |
| `resenas.php` | POST | Usuarios logueados |
| `notas.php` | GET, POST | Usuario logueado (solo sus notas) |
| `preferencias.php` | GET, POST | Usuario logueado |
| `sesion.php` | GET | Todos (devuelve estado de sesión) |

---

## 7. Funciones principales (JavaScript)

### `app.js`

| Función | Qué hace |
|---------|----------|
| `iniciarPaginaPrincipal()` | Arranca la página al cargar el DOM |
| `mostrarLibros(lista, contenedor)` | Pinta las tarjetas del catálogo |
| `crearTarjetaLibro(libro)` | Crea el HTML de una tarjeta con efecto flip |
| `cargarPortadaYSinopsis(tarjeta, libro)` | Busca en Google Books si faltan datos |
| `filtrarLibros(...)` | Filtra por título, autor y género |
| `ordenarPorPreferencias(...)` | Pone primero los libros del género/autor favorito |
| `abrirModalResenas(titulo, resenas)` | Abre el popup de reseñas |

### `prestamos.js`

| Función | Qué hace |
|---------|----------|
| `cargarPanelUsuario()` | Función principal de Mis Libros |
| `cambiarEstadoLibro(id, estado)` | Prestar (`prestado`) o devolver (`disponible`) |
| `crearTarjetaPrestado(libro)` | Tarjeta con nota, devolver y reseña |
| `crearTarjetaDisponible(libro)` | Tarjeta con botón "Coger prestado" |
| `guardarNota(id, texto, boton)` | Guarda nota privada en la BD |
| `renderizarPagina(num)` | Paginación del catálogo disponible |

### `admin.js`

| Función | Qué hace |
|---------|----------|
| `comprobarSesion()` | Redirige si no es admin |
| `cargarLibros()` | Estadísticas + lista de libros |
| `buscarEnGoogleBooks()` | Rellena portada y sinopsis en el formulario |
| `guardarLibro(evento)` | POST para crear un libro nuevo |
| `eliminarLibro(id)` | DELETE con confirmación |

---

## 8. Seguridad implementada

1. **Contraseñas:** Se guardan con `password_hash()` (bcrypt), nunca en texto plano.
2. **SQL Injection:** Consultas preparadas con `prepare()` y `bind_param()`.
3. **Sesiones PHP:** El servidor identifica al usuario con `$_SESSION`.
4. **Roles:** Las APIs comprueban si el usuario es `admin` antes de operaciones sensibles.
5. **Validación cliente:** `Usuario.js` valida antes de enviar; el servidor vuelve a validar.

---

## 9. Integración con Google Books

Cuando un libro no tiene portada o sinopsis en la base de datos, el JavaScript consulta la API pública de Google Books:

```
https://www.googleapis.com/books/v1/volumes?q=título+autor
```

Si encuentra datos, los muestra y los guarda en la BD con `PUT api/libros.php` (`guardar_gb: true`) para no repetir la petición.

---



## 10. Diagrama de comunicación

```
┌─────────────┐     fetch (JSON)      ┌─────────────┐     SQL      ┌──────────┐
│  Navegador  │ ◄──────────────────► │  PHP (api/) │ ◄──────────► │  MySQL   │
│  HTML+CSS+JS│                       │  sesiones   │              │biblioteca│
└─────────────┘                       └─────────────┘              └──────────┘
       │
       │ fetch (opcional)
       ▼
┌─────────────────┐
│ Google Books API│  (portadas y sinopsis)
└─────────────────┘
```

---


