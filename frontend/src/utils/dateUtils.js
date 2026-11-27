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

/**
 * Fecha operativa del Kardex (día de 07:00 a 07:00 del día siguiente).
 * Un registro hecho antes de las 07:00 (hora Lima) pertenece al día anterior.
 * @param {string|Date|null} dateInput - fecha/hora real del registro
 * @returns {string|null} 'YYYY-MM-DD'
 */
export const toOperationalDate = (dateInput) => {
  if (!dateInput) return null;
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
  const raw = typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2} \d/.test(dateInput)
    ? dateInput.replace(' ', 'T')
    : dateInput;
  const date = new Date(raw);
  if (isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});

  const local = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day));
  if (+parts.hour < 7) local.setUTCDate(local.getUTCDate() - 1);
  return local.toISOString().slice(0, 10);
};

/**
 * Obtiene la fecha operativa de un registro de reporte.
 * Prioriza `operational_date` enviado por el backend.
 * @param {object} item
 * @param {string} field - campo con la fecha/hora real (por defecto 'date')
 * @returns {string|null} 'YYYY-MM-DD'
 */
export const getOperationalDate = (item, field = 'date') => {
  if (!item) return null;
  return item.operational_date || toOperationalDate(item[field]);
};

/** dd/MM/yyyy de la fecha operativa */
export const formatOperationalDate = (item, field = 'date', fallback = '') => {
  const op = getOperationalDate(item, field);
  if (!op) return fallback;
  const [y, m, d] = op.split('-');
  return `${d}/${m}/${y}`;
};

/** "Semana N" según el día operativo del mes */
export const operationalWeekLabel = (item, field = 'date') => {
  const op = getOperationalDate(item, field);
  if (!op) return '';
  return `Semana ${Math.ceil(parseInt(op.split('-')[2], 10) / 7)}`;
};
