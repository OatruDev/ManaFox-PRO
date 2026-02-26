// /js/security.js

/**
 * 🛡️ UTILIDADES DE SEGURIDAD (OWASP ANTI-XSS)
 * Escapa caracteres peligrosos para evitar inyecciones en el DOM.
 */
export const esc = (s) => {
    if(s == null) return '';
    const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#x27;', '`':'&#x60;', '/':'&#x2F;', '=':'&#x3D;', '(':'&#x28;', ')':'&#x29;' };
    return String(s).replace(/[&<>"'`/=\(\)]/g, m => map[m]);
};