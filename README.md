# 📚 Biblioteca Digital

Aplicación web de gestión de biblioteca. Permite a los usuarios registrarse, buscar libros, hacer préstamos y escribir reseñas. Los administradores pueden gestionar el catálogo y los usuarios desde un panel de control.

---

## Tecnologías utilizadas

- **Frontend:** HTML, CSS, JavaScript (ES Modules)
- **Backend:** PHP
- **Base de datos:** MySQL
- **Servidor local:** XAMPP o WAMPP

---

## Requisitos previos

Antes de instalar el proyecto necesitas tener instalado:

- [WAMPP](https://www.apachefriends.org/es/index.html) (incluye Apache, PHP y MySQL)
- Un navegador web moderno (Chrome, Firefox, Edge...)

---

## Instalación paso a paso

### 1. Copiar el proyecto

Copia la carpeta `FinalSimpleFixed` dentro de la carpeta `htdocs` de tu instalación de XAMPP:

```
C:\xampp\htdocs\FinalSimpleFixed\
```

### 2. Iniciar los servicios

Abre el **Panel de control de WAMPP** y pulsa **Start** en:
- **Apache**
- **MySQL**

### 3. Importar la base de datos

1. Abre el navegador y ve a `http://localhost/phpmyadmin`
2. Haz clic en **Nueva** (en el panel izquierdo) y crea una base de datos llamada `biblioteca`
3. Con `biblioteca` seleccionada, ve a la pestaña **Importar**
4. Pulsa **Seleccionar archivo** y elige el archivo `biblioteca.sql` que está en la raíz del proyecto
5. Pulsa **Importar** al final de la página

### 4. Comprobar la conexión

El archivo `api/conexion.php` ya viene configurado para WAMPP con los valores por defecto:

```php
$host     = 'localhost';
$bd       = 'biblioteca';
$usuario  = 'root';
$password = '';           // XAMPP no tiene contraseña por defecto
```

Si tu MySQL tiene contraseña, cámbiala en ese archivo.

### 5. Abrir la aplicación

Abre el navegador y ve a:

```
http://localhost/FinalSimpleFixed/index.html
```

---

## Usuarios de prueba

> ⚠️ Estas cuentas son solo para evaluación. No uses estas contraseñas en ningún otro sitio.

| Rol       | Email                  | Contraseña   |
|-----------|------------------------|--------------|
| Admin     | admin@biblioteca.com   | Admin1234    |
| Usuario   | prueba@biblioteca.com  | Usuario1234  |

El usuario de prueba se puede crear desde la página de **Registro** o desde el panel de administración.

---

## Estructura del proyecto

```
FinalSimpleFixed/
├── index.html              # Catálogo de libros (página principal)
├── login.html              # Inicio de sesión
├── registro.html           # Registro de nuevos usuarios
├── mis-libros.html         # Préstamos del usuario
├── administracion.html     # Panel de administración
├── global.css              # Estilos de toda la aplicación
├── biblioteca.sql          # Script SQL de la base de datos
│
├── api/                    # Backend en PHP
│   ├── conexion.php        # Configuración de la BD
│   ├── login.php           # Inicio de sesión
│   ├── registro.php        # Registro de usuarios
│   ├── sesion.php          # Comprueba si hay sesión activa
│   ├── logout.php          # Cierra la sesión
│   ├── libros.php          # CRUD de libros
│   ├── usuarios.php        # CRUD de usuarios
│   └── prestamos.php       # Gestión de préstamos
│
├── js/                     # JavaScript del frontend
│   ├── app.js              # Lógica del catálogo principal
│   ├── admin.js            # Lógica del panel de administración
│   ├── usuarios.js         # Gestión de usuarios en el panel
│   ├── prestamos.js        # Lógica de préstamos
│   ├── infoLibros.js       # Detalle de libro
│   ├── auth/
│   │   ├── login.js        # Formulario de login
│   │   └── registro.js     # Formulario de registro
│   └── objects/
│       ├── Libro.js        # Clase Libro
│       └── Usuario.js      # Clase Usuario (con validaciones)
│
├── imagenes/               # Recursos estáticos (música, iconos...)
└── docs/                   # Documentación de la base de datos
```

---

## Funcionalidades

**Usuarios registrados:**
- Ver el catálogo completo de libros
- Pedir prestado y devolver libros
- Ver sus libros prestados en "Mis Libros"
- Escribir reseñas y puntuar libros
- Guardar notas privadas sobre un libro
- Guardar preferencias de género y autor

**Administradores:**
- Todo lo anterior
- Añadir y eliminar libros (con búsqueda de portada en Google Books)
- Ver estadísticas del catálogo (total, prestados, disponibles)
- Gestionar usuarios (crear, eliminar)
