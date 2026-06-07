// registro.js
// Controla el formulario de registro (registro.html)
// Valida los campos en el cliente y luego manda los datos al servidor

import { Usuario } from "../objects/Usuario.js";
import { ponerEstado } from "../poner-estado.js";

var formulario = document.getElementById('form-registro');

formulario.addEventListener('submit', async function(evento) {

    evento.preventDefault();
    limpiarErrores();

    var email     = document.getElementById('email').value.trim();
    var password  = document.getElementById('password').value.trim();
    var password2 = document.getElementById('password2').value.trim();

    var hayError = false;

    var usuario = new Usuario(email, password);

    var errorEmail = usuario.validarEmail();
    if (errorEmail !== true) {
        mostrarError('error-email', errorEmail);
        hayError = true;
    }

    var errorPassword = usuario.validarPassword();
    if (errorPassword !== true) {
        mostrarError('error-password', errorPassword);
        hayError = true;
    }

    if (password !== password2) {
        mostrarError('error-password2', 'Las contraseñas no coinciden.');
        hayError = true;
    }

    if (hayError) return;

    mostrarMensaje('Creando cuenta...', 'info');

    var respuesta = await fetch('api/registro.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, password: password })
    });

    var datos = await respuesta.json();

    if (datos.ok) {
        mostrarMensaje('¡Cuenta creada! Redirigiendo...', 'ok');
        setTimeout(function() {
            window.location.href = datos.redirect;
        }, 1000);
    } else {
        mostrarMensaje(datos.error || 'Error al crear la cuenta.', 'error');
    }
});

function mostrarError(idElemento, texto) {
    var el = document.getElementById(idElemento);
    ponerEstado(el, texto, 'error');
}

function limpiarErrores() {
    var errores = ['error-email', 'error-password', 'error-password2'];
    errores.forEach(function(id) {
        ponerEstado(document.getElementById(id), '', '');
    });
    mostrarMensaje('', '');
}

function mostrarMensaje(texto, estado) {
    ponerEstado(document.getElementById('mensaje-estado'), texto, estado);
}
