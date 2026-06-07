// login.js
// Controla el formulario de inicio de sesión (login.html)
// Valida en el cliente y manda las credenciales al servidor

import { Usuario } from "../objects/Usuario.js";
import { ponerEstado } from "../poner-estado.js";

var formulario = document.querySelector('[data-auth="form"]');

formulario.addEventListener('submit', async function(evento) {

    evento.preventDefault();

    var email    = document.querySelector('[data-auth="email"]').value.trim();
    var password = document.querySelector('[data-auth="password"]').value.trim();

    // Valido con la clase Usuario antes de mandar nada al servidor
    var usuario = new Usuario(email, password);

    var errorEmail = usuario.validarEmail();
    if (errorEmail !== true) {
        mostrarMensaje(errorEmail, 'error');
        return;
    }

    var errorPassword = usuario.validarPassword();
    if (errorPassword !== true) {
        mostrarMensaje(errorPassword, 'error');
        return;
    }

    mostrarMensaje('Verificando...', 'info');

    var respuesta = await fetch('api/login.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, password: password })
    });

    var datos = await respuesta.json();

    if (datos.ok) {
        mostrarMensaje('¡Acceso correcto! Redirigiendo...', 'ok');
        window.location.href = datos.redirect;
    } else {
        mostrarMensaje(datos.error || 'Correo o contraseña incorrectos', 'error');
    }
});

// Muestra un mensaje debajo del formulario (el color lo define global.css con data-estado)
function mostrarMensaje(texto, tipo) {
    var mensajeEl = document.querySelector('[data-auth="message"]');
    ponerEstado(mensajeEl, texto, tipo);
}

var linkRegistro = document.getElementById('link-registro');
if (linkRegistro) {
    linkRegistro.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'registro.html';
    });
}
