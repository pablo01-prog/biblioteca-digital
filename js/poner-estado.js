// =============================================================================
// poner-estado.js — Cambia el texto y el estado visual de un mensaje
//
// El JavaScript NO define colores ni estilos. Solo asigna data-estado.
// Los colores correspondientes están definidos en global.css.
// =============================================================================

export function ponerEstado(elemento, texto, estado) {
    if (!elemento) {
        return;
    }

    elemento.textContent = texto;

    if (estado) {
        elemento.setAttribute('data-estado', estado);
    } else {
        elemento.removeAttribute('data-estado');
    }
}
