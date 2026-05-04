// ============================================================
//  Usuario.js — Clase para validar los datos del usuario
//  Se usa en el login y en el panel de administración
// ============================================================

export class Usuario {

    // El constructor recibe el email y la contraseña
    constructor(nombreUser, passwd) {
        this.nombreUser = nombreUser; // Email del usuario
        this.passwd     = passwd;     // Contraseña del usuario
    }

    // ── Método: validar el email ─────────────────────────────
    // Devuelve true si es válido, o un mensaje de error si no lo es
    validarNombreUser() {

        // El email debe empezar por una letra
        if (!/^[a-zA-Z]/.test(this.nombreUser)) {
            return "El correo debe comenzar con una letra.";
        }

        // El email debe tener el formato correcto: algo@algo.algo
        if (!/^[^@]+@[^@]+\.[a-zA-Z]{2,}$/.test(this.nombreUser)) {
            return "El formato de correo no es válido.";
        }

        // Si pasa todas las comprobaciones, devolvemos true
        return true;
    }

    // ── Método: validar la contraseña ────────────────────────
    // Devuelve true si es válida, o un mensaje de error si no lo es
    validarPasswdUser() {

        // Mínimo 8 caracteres
        if (!/^.{8,}$/.test(this.passwd)) {
            return "La contraseña debe tener al menos 8 caracteres.";
        }

        // Al menos una letra mayúscula
        if (!/[A-Z]/.test(this.passwd)) {
            return "Debe contener al menos una mayúscula.";
        }

        // Al menos una letra minúscula
        if (!/[a-z]/.test(this.passwd)) {
            return "Debe contener al menos una minúscula.";
        }

        // Si pasa todo, la contraseña es válida
        return true;
    }
}