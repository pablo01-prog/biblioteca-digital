// ============================================================
//  login.js — Formulario de inicio de sesión (login.html)
//  Valida los campos y envía las credenciales al servidor
// ============================================================

import { Usuario } from "../objects/Usuario.js";

// Obtenemos el formulario de login
var formulario = document.querySelector('[data-auth="form"]');

// ── Evento: cuando el usuario pulsa "Entrar" ─────────────────
formulario.addEventListener('submit', async function(evento) {

    // Evitamos que el formulario recargue la página
    evento.preventDefault();

    // Recogemos los valores que ha escrito el usuario
    var email    = document.querySelector('[data-auth="email"]').value.trim();
    var password = document.querySelector('[data-auth="password"]').value.trim();

    // ── Validación en el cliente ─────────────────────────────
    // Creamos un objeto Usuario para usar sus métodos de validación
    var usuario = new Usuario(email, password);

    // Validamos el email
    var errorEmail = usuario.validarNombreUser();
    if (errorEmail !== true) {
        mostrarMensaje(errorEmail, 'red');
        return; // Paramos aquí si hay error
    }

    // Validamos la contraseña
    var errorPassword = usuario.validarPasswdUser();
    if (errorPassword !== true) {
        mostrarMensaje(errorPassword, 'red');
        return; // Paramos aquí si hay error
    }

    // ── Envío al servidor ────────────────────────────────────
    mostrarMensaje('Verificando...', 'blue');

    // Enviamos email y password al servidor mediante fetch
    var respuesta = await fetch('api/login.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, password: password })
    });

    var datos = await respuesta.json();

    // Si el servidor confirma que las credenciales son correctas
    if (datos.ok) {
        mostrarMensaje('¡Acceso correcto! Redirigiendo...', 'green');

        // El servidor nos dice a qué página ir según el rol del usuario
        window.location.href = datos.redirect;

    } else {
        // El servidor ha rechazado las credenciales
        mostrarMensaje(datos.error || 'Correo o contraseña incorrectos', 'red');
    }
});

// ── Función: mostrar mensajes de estado bajo el formulario ───
function mostrarMensaje(texto, color) {
    var mensajeEl = document.querySelector('[data-auth="message"]');
    if (!mensajeEl) return;
    mensajeEl.textContent = texto;
    mensajeEl.style.color = color;
}