/**
 * dateUtils.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilidades de formato de fechas para toda la aplicación.
 * Convierte fechas ISO (ej: "2026-10-15T05:00:00.000000Z") a formatos legibles.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Formatea una fecha al estilo peruano: dd/MM/yyyy
 * Maneja fechas ISO, YYYY-MM-DD y objetos Date.
 * @param {string|Date|null} dateInput
 * @param {string} fallback - Valor por defecto si la fecha es inválida
 * @returns {string}
 */
export const formatDate = (dateInput, fallback = '—') => {
  if (!dateInput) return fallback;
  try {
    // Si ya viene como "YYYY-MM-DD" (sin hora), la procesamos directamente
    // para evitar desfase de zona horaria
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split('-');
      return `${day}/${month}/${year}`;
    }
    // Para fechas ISO completas o con hora
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Lima'
    });
  } catch {
    return fallback;
  }
};

/**
 * Formatea una fecha con hora: dd/MM/yyyy HH:mm
 * @param {string|Date|null} dateInput
 * @param {string} fallback
 * @returns {string}
 */
export const formatDateTime = (dateInput, fallback = '—') => {
  if (!dateInput) return fallback;
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Lima'
    });
  } catch {
    return fallback;
  }
};

/**
 * Formatea solo la hora: HH:mm
 * @param {string|Date|null} dateInput
 * @param {string} fallback
 * @returns {string}
 */
export const formatTime = (dateInput, fallback = '—') => {
  if (!dateInput) return fallback;
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Lima'
    });
  } catch {
    return fallback;
  }
};
