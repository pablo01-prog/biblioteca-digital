// usuarios.js
// Controla la sección de gestión de usuarios dentro del panel de administración
// Se carga junto con admin.js en administracion.html

import { Usuario } from "./objects/Usuario.js";
import { ponerEstado } from "./poner-estado.js";

// Navegación entre las secciones del panel (Libros / Usuarios)
var botonesNav = document.querySelectorAll('[data-target]');

for (let i = 0; i < botonesNav.length; i++) {
    botonesNav[i].addEventListener('click', function() {

        // Marco el botón pulsado como activo y quito el activo al resto
        for (let j = 0; j < botonesNav.length; j++) {
            botonesNav[j].classList.remove('activo');
        }
        this.classList.add('activo');

        let seccion = this.dataset.target;

        // Muestro la sección elegida y oculto la otra
        document.getElementById('seccion-libros').hidden   = (seccion != 'libros');
        document.getElementById('seccion-usuarios').hidden = (seccion != 'usuarios');

        if (seccion == 'usuarios') {
            cargarUsuarios();
        }
    });
}

// Abrir el modal de nuevo usuario
document.querySelector('[data-modal-open="nuevo-usuario"]').addEventListener('click', function() {
    document.getElementById('modal-usuario-titulo').textContent = 'Añadir Nuevo Usuario';
    limpiarFormulario();
    document.querySelector('[data-modal="nuevo-usuario"]').hidden = false;
});

// Cerrar el modal
document.querySelector('[data-modal-close="nuevo-usuario"]').addEventListener('click', function() {
    document.querySelector('[data-modal="nuevo-usuario"]').hidden = true;
    limpiarFormulario();
});

// Vacía todos los campos del formulario de usuario
function limpiarFormulario() {
    document.getElementById('usuario-id').value       = '';
    document.getElementById('usuario-email').value    = '';
    document.getElementById('usuario-password').value = '';
    document.getElementById('usuario-rol').value      = 'usuario';
    document.getElementById('error-email').textContent    = '';
    document.getElementById('error-password').textContent = '';
    document.getElementById('msg-usuario').textContent    = '';
}

// Pide los usuarios al servidor y pinta la tabla
async function cargarUsuarios() {
    let contenedor = document.getElementById('lista-admin-usuarios');
    contenedor.innerHTML = '<p>Cargando...</p>';

    let respuesta = await fetch('api/usuarios.php');
    let usuarios  = await respuesta.json();

    if (!Array.isArray(usuarios) || usuarios.length == 0) {
        contenedor.innerHTML = '<p>No hay usuarios registrados.</p>';
        return;
    }

    // Creo la tabla manualmente para tener control total sobre el HTML
    let tabla = document.createElement('table');
    tabla.className = 'tabla-usuarios';

    tabla.innerHTML =
        '<thead>' +
            '<tr><th>#</th><th>Email</th><th>Rol</th><th>Fecha de registro</th><th>Acciones</th>' +
            '</tr>' +
        '</thead>' +
        '<tbody id="tabla-usuarios-body"></tbody>';

    contenedor.innerHTML = '';
    contenedor.appendChild(tabla);

    let tbody = document.getElementById('tabla-usuarios-body');

    for (let i = 0; i < usuarios.length; i++) {
        let u    = usuarios[i];
        let fila = document.createElement('tr');



        fila.innerHTML =
            '<td>' + (i + 1) + '</td>' +
            '<td><strong>' + u.email + '</strong></td>' +
            '<td>' +
                '<span class="badge-rol badge-rol--' + u.rol + '">' + u.rol + '</span>' +
            '</td>' +
            '<td class="td-fecha">' + (u.created_at || '—') + '</td>' +
            '<td></td>';

        let btnEliminar = document.createElement('button');
        btnEliminar.className         = 'boton boton-contorno';
        btnEliminar.classList.add('btn-eliminar-usuario');
        btnEliminar.textContent       = '🗑 Eliminar';

        // Capturo el id y el email para usarlos en el confirm
        let idU    = u.id;
        let emailU = u.email;
        btnEliminar.addEventListener('click', function() {
            eliminarUsuario(idU, emailU);
        });

        fila.querySelector('td:last-child').appendChild(btnEliminar);
        tbody.appendChild(fila);
    }
}

// Pide al servidor que elimine el usuario con ese id
async function eliminarUsuario(id, email) {
    if (!confirm('¿Seguro que quieres eliminar al usuario "' + email + '"?')) return;

    let respuesta = await fetch('api/usuarios.php', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: id })
    });

    let resultado = await respuesta.json();

    if (resultado.ok) {
        cargarUsuarios(); // recargo la tabla
    } else {
        alert('Error al eliminar: ' + resultado.error);
    }
}

// Formulario de creación o edición de usuario
document.getElementById('form-usuario').addEventListener('submit', async function(evento) {
    evento.preventDefault();

    let id       = document.getElementById('usuario-id').value;
    let email    = document.getElementById('usuario-email').value.trim();
    let password = document.getElementById('usuario-password').value.trim();
    let rol      = document.getElementById('usuario-rol').value;
    let msg      = document.getElementById('msg-usuario');
    let errEmail = document.getElementById('error-email');
    let errPass  = document.getElementById('error-password');

    errEmail.textContent = '';
    errPass.textContent  = '';

    // Valido email usando la clase Usuario
    let validEmail = new Usuario(email, 'Placeholder1').validarEmail();
    if (validEmail != true) {
        errEmail.textContent = validEmail;
        return;
    }

    // Solo valido la contraseña si el admin ha escrito una nueva
    if (password) {
        let validPass = new Usuario(email, password).validarPassword();
        if (validPass != true) {
            errPass.textContent = validPass;
            return;
        }
    }

    // Si hay id es edición, si no es creación
    let metodo = (id != '') ? 'PUT' : 'POST';
    let datos  = { email: email, rol: rol };

    if (id != '')   datos.id       = id;
    if (password)   datos.password = password;

    ponerEstado(msg, 'Guardando...', 'cargando');

    let respuesta = await fetch('api/usuarios.php', {
        method:  metodo,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(datos)
    });

    let resultado = await respuesta.json();

    if (resultado.ok) {
        ponerEstado(msg, '✅ Usuario guardado correctamente.', 'ok');

        setTimeout(function() {
            document.querySelector('[data-modal="nuevo-usuario"]').hidden = true;
            limpiarFormulario();
            cargarUsuarios();
        }, 800);
    } else {
        ponerEstado(msg, '❌ ' + (resultado.error || 'Error desconocido'), 'error');
    }
});
