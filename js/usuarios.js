// ============================================================
//  usuarios.js — Gestión de usuarios en el panel de admin
//  Muestra una tabla con email y rol (sin contraseña)
//  y permite eliminar usuarios de la base de datos
// ============================================================

import { Usuario } from "./objects/Usuario.js";

// ── Navegación entre secciones del panel ─────────────────────
// Cuando se pulsa un botón del menú lateral, muestra la sección correspondiente
document.querySelectorAll('[data-target]').forEach(function(boton) {

    boton.addEventListener('click', function() {

        // Quitamos la clase "activo" de todos los botones
        document.querySelectorAll('[data-target]').forEach(function(b) {
            b.classList.remove('activo');
        });

        // Se la ponemos solo al botón pulsado
        boton.classList.add('activo');

        // Leemos qué sección quiere ver el usuario
        var seccionDestino = boton.dataset.target;

        // Mostramos u ocultamos cada sección según corresponda
        var seccionLibros   = document.getElementById('seccion-libros');
        var seccionUsuarios = document.getElementById('seccion-usuarios');

        if (seccionLibros)   seccionLibros.hidden   = (seccionDestino !== 'libros');
        if (seccionUsuarios) seccionUsuarios.hidden = (seccionDestino !== 'usuarios');

        // Si el usuario quiere ver la lista de usuarios, la cargamos
        if (seccionDestino === 'usuarios') cargarUsuarios();
    });
});

// ── Funciones para abrir y cerrar el modal ───────────────────
// para mostrar o ocultar el recuadro de creacion
function abrirModal() {
    var modal = document.querySelector('[data-modal="nuevo-usuario"]');
    if (modal) modal.hidden = false;
}

function cerrarModal() {
    var modal = document.querySelector('[data-modal="nuevo-usuario"]');
    if (modal) modal.hidden = true;
    limpiarFormulario();
}

// Botón "Nuevo Usuario" abre el modal en modo creación
var btnNuevoUsuario = document.querySelector('[data-modal-open="nuevo-usuario"]');
if (btnNuevoUsuario) {
    btnNuevoUsuario.addEventListener('click', function() {
        var titulo = document.getElementById('modal-usuario-titulo');
        if (titulo) titulo.textContent = 'Añadir Nuevo Usuario';
        limpiarFormulario();
        abrirModal();
    });
}

// Botón "Cancelar" cierra el modal
var btnCerrarModal = document.querySelector('[data-modal-close="nuevo-usuario"]');
if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', cerrarModal);
}

// ── Función: limpiar el formulario del modal ─────────────────
function limpiarFormulario() {

    // Vaciamos todos los campos
    var campoId       = document.getElementById('usuario-id');
    var campoEmail    = document.getElementById('usuario-email');
    var campoPassword = document.getElementById('usuario-password');
    var campoRol      = document.getElementById('usuario-rol');

    if (campoId)       campoId.value       = '';
    if (campoEmail)    campoEmail.value    = '';
    if (campoPassword) campoPassword.value = '';
    if (campoRol)      campoRol.value      = 'usuario';

    // Limpiamos también los mensajes de error
    var errEmail = document.getElementById('error-email');
    var errPass  = document.getElementById('error-password');
    var msgEl    = document.getElementById('msg-usuario');

    if (errEmail) errEmail.textContent = '';
    if (errPass)  errPass.textContent  = '';
    if (msgEl)    msgEl.textContent    = '';
}

// ── Función: cargar y mostrar usuarios en tabla ──────────────
async function cargarUsuarios() {

    var contenedor = document.getElementById('lista-admin-usuarios');
    if (!contenedor) return;

    contenedor.innerHTML = '<p>Cargando...</p>';

    // Pedimos la lista de usuarios al servidor
    // El servidor devuelve email y rol, NUNCA la contraseña
    var respuesta = await fetch('api/usuarios.php', { cache: 'no-store' });
    var usuarios  = await respuesta.json();

    // Si no hay usuarios, mostramos mensaje
    if (!Array.isArray(usuarios) || usuarios.length === 0) {
        contenedor.innerHTML = '<p>No hay usuarios registrados.</p>';
        return;
    }

    // Construimos una tabla HTML para mostrar los datos
    var tabla = document.createElement('table');
    tabla.style.cssText = 'width:100%; border-collapse:collapse; background:white; border-radius:12px; overflow:hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.07);';

    // Cabecera de la tabla — sin columna de contraseña
    tabla.innerHTML =
        '<thead>' +
            '<tr style="background: var(--color-borgona); color: white; text-align:left;">' +
                '<th style="padding:14px 18px;">#</th>' +
                '<th style="padding:14px 18px;">Email</th>' +
                '<th style="padding:14px 18px;">Rol</th>' +
                '<th style="padding:14px 18px;">Fecha de registro</th>' +
                '<th style="padding:14px 18px;">Acciones</th>' +
            '</tr>' +
        '</thead>' +
        '<tbody id="tabla-usuarios-body"></tbody>';

    contenedor.innerHTML = '';
    contenedor.appendChild(tabla);

    var tbody = document.getElementById('tabla-usuarios-body');

    // Creamos una fila por cada usuario
    usuarios.forEach(function(usuario, indice) {

        var fila = document.createElement('tr');
        fila.style.cssText = 'border-bottom: 1px solid var(--color-borde); background:' + (indice % 2 === 0 ? '#fafafa' : 'white') + ';';

        // Celdas de texto con los datos del usuario
        fila.innerHTML =
            '<td style="padding:12px 18px;">' + (indice + 1) + '</td>' +
            '<td style="padding:12px 18px;"><strong>' + usuario.email + '</strong></td>' +
            '<td style="padding:12px 18px;">' +
                '<span style="background:' + (usuario.rol === 'admin' ? 'var(--color-borgona)' : 'var(--color-oliva)') + '; color:white; padding:3px 12px; border-radius:20px; font-size:0.8rem;">' +
                    usuario.rol +
                '</span>' +
            '</td>' +
            '<td style="padding:12px 18px; font-size:0.85rem;">' + (usuario.created_at || '—') + '</td>' +
            '<td style="padding:12px 18px;"></td>';

        // Botón eliminar — usamos addEventListener para evitar onclick inline
        var btnEliminar = document.createElement('button');
        btnEliminar.className = 'boton boton-contorno';
        btnEliminar.style.cssText = 'font-size:0.85rem; padding:5px 14px; color:var(--color-borgona); border-color:var(--color-borgona);';
        btnEliminar.textContent = '🗑 Eliminar';

        // Guardamos el id y email en una variable local para usarlos en el evento
        var idUsuario    = usuario.id;
        var emailUsuario = usuario.email;

        btnEliminar.addEventListener('click', function() {
            eliminarUsuario(idUsuario, emailUsuario);
        });

        fila.querySelector('td:last-child').appendChild(btnEliminar);
        tbody.appendChild(fila);
    });
}

// ── Función: eliminar un usuario ─────────────────────────────
async function eliminarUsuario(id, email) {

    // Confirmación antes de borrar, mostrando el email del usuario
    if (!confirm('¿Seguro que quieres eliminar al usuario "' + email + '"?')) return;

    // Enviamos la petición de borrado al servidor
    var respuesta = await fetch('api/usuarios.php', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: id })
    });

    var resultado = await respuesta.json();

    // Si fue bien, recargamos la tabla
    if (resultado.ok) {
        cargarUsuarios();
    } else {
        alert('Error al eliminar: ' + (resultado.error || 'Error desconocido'));
    }
}

// ── Formulario: crear nuevo usuario ─────────────────────────
var formUsuario = document.getElementById('form-usuario');
if (formUsuario) {

    formUsuario.addEventListener('submit', async function(evento) {
        evento.preventDefault(); // Evitamos que recargue la página

        // Recogemos los valores del formulario
        var id       = document.getElementById('usuario-id').value;
        var email    = document.getElementById('usuario-email').value.trim();
        var password = document.getElementById('usuario-password').value.trim();
        var rol      = document.getElementById('usuario-rol').value;

        var msgEl    = document.getElementById('msg-usuario');
        var errEmail = document.getElementById('error-email');
        var errPass  = document.getElementById('error-password');

        // Limpiamos errores anteriores
        if (errEmail) errEmail.textContent = '';
        if (errPass)  errPass.textContent  = '';

        // Validamos el email con nuestra clase Usuario
        var validacionEmail = new Usuario(email, 'Placeholder1').validarNombreUser();
        if (validacionEmail !== true) {
            if (errEmail) errEmail.textContent = validacionEmail;
            return;
        }

        // Validamos la contraseña solo si se ha introducido una
        if (password) {
            var validacionPass = new Usuario(email, password).validarPasswdUser();
            if (validacionPass !== true) {
                if (errPass) errPass.textContent = validacionPass;
                return;
            }
        }

        // Si hay id, es una edición; si no, es una creación nueva
        var esEdicion = (id !== '');
        var metodo    = esEdicion ? 'PUT' : 'POST';
        var datos     = esEdicion
            ? { id: id, email: email, rol: rol }
            : { email: email, password: password, rol: rol };

        // Si estamos editando y se introdujo nueva contraseña, la incluimos
        if (esEdicion && password) {
            datos.password = password;
        }

        if (msgEl) { msgEl.textContent = 'Guardando...'; msgEl.style.color = 'blue'; }

        // Enviamos los datos al servidor
        var respuesta = await fetch('api/usuarios.php', {
            method:  metodo,
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(datos)
        });

        var resultado = await respuesta.json();

        if (resultado.ok) {
            if (msgEl) { msgEl.textContent = '✅ Usuario guardado correctamente'; msgEl.style.color = 'green'; }

            // Esperamos un momento y cerramos el modal
            setTimeout(function() {
                cerrarModal();
                cargarUsuarios();
            }, 800);
        } else {
            if (msgEl) { msgEl.textContent = '❌ ' + (resultado.error || 'Error desconocido'); msgEl.style.color = 'red'; }
        }
    });
}