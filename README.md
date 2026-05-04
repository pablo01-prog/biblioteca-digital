##  Biblioteca Digital

Sistema web de gestión de préstamos de libros desarrollado como proyecto final del ciclo de **Desarrollo de Aplicaciones Web (DAW)**.

---

##  Descripción

Biblioteca Digital es una aplicación web que permite gestionar un catálogo de libros y un sistema de préstamos entre usuarios registrados.

La aplicación cuenta con dos tipos de usuario:

- **Administrador**: puede gestionar el catálogo de libros (añadir, eliminar) y gestionar los usuarios registrados (ver, eliminar).
- **Usuario registrado**: puede consultar el catálogo, coger libros prestados y devolverlos. Cada usuario solo ve sus propios préstamos.

---

## Tecnologías utilizadas

| Capa | Tecnología | Uso |
|------|-----------|-----|
| Frontend | HTML5, CSS3 | Estructura y estilos de las páginas |
| Frontend | JavaScript ES6 (módulos) | Lógica del cliente, validaciones, fetch |
| Backend | PHP 8 | API REST, gestión de sesiones |
| Base de datos | MySQL | Almacenamiento persistente |
| Servidor | Apache (WAMP) | Entorno local de desarrollo en Windows |

---

## Estructura del proyecto

biblioteca-digital/
│
├── index.html              # Página principal — catálogo público
├── login.html              # Formulario de inicio de sesión
├── mis-libros.html         # Área personal del usuario (préstamos)
├── administracion.html     # Panel de administración
├── global.css              # Hoja de estilos global
│
├── js/                     # Scripts del cliente
│   ├── app.js              # Lógica de index.html
│   ├── prestamos.js        # Lógica de mis-libros.html
│   ├── admin.js            # Lógica del panel de administración
│   ├── usuarios.js         # Gestión de usuarios en el panel admin
│   ├── objects/
│   │   ├── Libro.js        # Clase Libro
│   │   └── Usuario.js      # Clase Usuario (validaciones)
│   └── auth/
│       └── login.js        # Lógica del formulario de login
│
├── api/                    # Backend PHP
│   ├── conexion.php        # Conexión a la base de datos
│   ├── login.php           # Autenticación de usuarios
│   ├── logout.php          # Cierre de sesión
│   ├── sesion.php          # Estado de la sesión activa
│   ├── libros.php          # API CRUD de libros
│   └── usuarios.php        # API CRUD de usuarios (solo admin)
│
└── imagenes/               # Imágenes y recursos multimedia


---

##  Instrucciones para ejecutar el proyecto

### Requisitos previos
- **WAMP** instalado y en ejecución (Apache + MySQL)
- Navegador web moderno (Chrome, Firefox, Edge)

### Pasos

1. Copiar la carpeta del proyecto en `C:\wamp64\www\biblioteca-digital\`
2. Crear la base de datos `biblioteca` en phpMyAdmin y ejecutar:

```sql
CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE libros (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  titulo     VARCHAR(255) NOT NULL,
  autor      VARCHAR(255) NOT NULL,
  estado     ENUM('disponible', 'prestado') NOT NULL DEFAULT 'disponible',
  usuario_id INT DEFAULT NULL,
  imagen_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
```

3. Abrir en el navegador: `http://localhost/biblioteca-digital/login.html`

---

##  Funcionalidades implementadas

- [x] Inicio de sesión con sesión PHP segura
- [x] Cierre de sesión con limpieza de caché
- [x] Catálogo público de libros con buscador
- [x] Sistema de préstamos por usuario
- [x] Panel de administración protegido por rol
- [x] CRUD de libros (añadir, eliminar)
- [x] Gestión de usuarios (ver tabla sin contraseñas, eliminar)
- [x] Contraseñas cifradas con bcrypt
- [x] Protección contra SQL Injection con consultas preparadas

##  Funcionalidades pendientes

- [ ] Registro público de nuevos usuarios
- [ ] Filtro del catálogo por género o categoría
- [ ] Edición de libros desde el panel de administración
- [ ] Borrado lógico
- [ ] Historial de préstamos

---

##  Autor

**Pablo González Hernández**
Desarrollo de Aplicaciones Web — DAW
2025 / 2026
