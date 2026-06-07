// =============================================================================
// Usuario.js — Validación de email y contraseña en el navegador
//
// Se usa en login.js, registro.js y usuarios.js antes de enviar datos al servidor.
// Cada método devuelve true si es válido, o un texto de error si no lo es.
// =============================================================================

export class Usuario {

    // Entrada: email y contraseña del formulario
    constructor(email, password) {
        this.email = email;
        this.password = password;
    }

    // Comprueba que el email tiene un formato correcto (ejemplo@dominio.com)
    validarEmail() {
        if (!/^[a-zA-Z]/.test(this.email)) {
            return 'El correo debe comenzar con una letra.';
        }

        if (!/^[^@]+@[^@]+\.[a-zA-Z]{2,}$/.test(this.email)) {
            return 'El formato de correo no es válido.';
        }

        return true;
    }

    // Comprueba que la contraseña cumple las reglas de seguridad mínimas
    validarPassword() {
        if (!/^.{8,}$/.test(this.password)) {
            return 'La contraseña debe tener al menos 8 caracteres.';
        }

        if (!/[A-Z]/.test(this.password)) {
            return 'Debe contener al menos una mayúscula.';
        }

        if (!/[a-z]/.test(this.password)) {
            return 'Debe contener al menos una minúscula.';
        }

        return true;
    }
}
