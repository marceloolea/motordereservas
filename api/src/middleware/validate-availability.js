const { errorResponse } = require('../utils/response');

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EXCEPTION_TYPES = ['block', 'add'];

const normalizeTime = (t) => {
  if (!t) return t;
  const parts = t.split(':');
  return `${parts[0].padStart(2, '0')}:${parts[1]}`;
};

const validateSchedule = (req, res, next) => {
  const errors = [];
  const { day_of_week, start_time, end_time, is_active } = req.body;

  if (day_of_week === undefined || day_of_week === null) {
    errors.push('day_of_week es requerido (0=domingo .. 6=sábado)');
  } else {
    const dow = Number(day_of_week);
    if (!Number.isInteger(dow) || dow < 0 || dow > 6) {
      errors.push('day_of_week debe ser un entero entre 0 y 6');
    }
  }

  if (!start_time || !TIME_REGEX.test(start_time)) {
    errors.push('start_time es requerido en formato HH:MM');
  }
  if (!end_time || !TIME_REGEX.test(end_time)) {
    errors.push('end_time es requerido en formato HH:MM');
  }

  if (start_time && end_time && TIME_REGEX.test(start_time) && TIME_REGEX.test(end_time)) {
    const [sh, sm] = start_time.split(':').map(Number);
    const [eh, em] = end_time.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      errors.push('end_time debe ser mayor a start_time');
    }
  }

  if (is_active !== undefined && typeof is_active !== 'boolean') {
    errors.push('is_active debe ser booleano');
  }

  if (errors.length > 0) return errorResponse(res, 'Error de validación', 400, errors);

  req.body.start_time = normalizeTime(start_time);
  req.body.end_time = normalizeTime(end_time);
  next();
};

const validateException = (req, res, next) => {
  const errors = [];
  const { exception_date, type, start_time, end_time, reason } = req.body;

  if (!exception_date || !DATE_REGEX.test(exception_date)) {
    errors.push('exception_date es requerido en formato YYYY-MM-DD');
  }

  if (!type || !EXCEPTION_TYPES.includes(type)) {
    errors.push(`type es requerido y debe ser uno de: ${EXCEPTION_TYPES.join(', ')}`);
  }

  const hasStart = start_time !== undefined && start_time !== null && start_time !== '';
  const hasEnd = end_time !== undefined && end_time !== null && end_time !== '';

  if (type === 'add' && (!hasStart || !hasEnd)) {
    errors.push('para type=add, start_time y end_time son requeridos');
  }

  if (hasStart && !TIME_REGEX.test(start_time)) errors.push('start_time inválido (HH:MM)');
  if (hasEnd && !TIME_REGEX.test(end_time)) errors.push('end_time inválido (HH:MM)');

  if (hasStart && hasEnd && TIME_REGEX.test(start_time) && TIME_REGEX.test(end_time)) {
    const [sh, sm] = start_time.split(':').map(Number);
    const [eh, em] = end_time.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      errors.push('end_time debe ser mayor a start_time');
    }
  }

  if (hasStart !== hasEnd) {
    errors.push('start_time y end_time deben venir juntos o ambos vacíos');
  }

  if (reason !== undefined && reason !== null && typeof reason !== 'string') {
    errors.push('reason debe ser texto');
  } else if (typeof reason === 'string' && reason.length > 500) {
    errors.push('reason no puede superar 500 caracteres');
  }

  if (errors.length > 0) return errorResponse(res, 'Error de validación', 400, errors);

  req.body.start_time = hasStart ? normalizeTime(start_time) : null;
  req.body.end_time = hasEnd ? normalizeTime(end_time) : null;
  next();
};

const validateSlotsQuery = (req, res, next) => {
  const errors = [];
  const { from, to } = req.query;

  if (!from || !DATE_REGEX.test(from)) errors.push('from requerido (YYYY-MM-DD)');
  if (!to || !DATE_REGEX.test(to)) errors.push('to requerido (YYYY-MM-DD)');

  if (errors.length === 0) {
    const fromDate = new Date(`${from}T00:00:00Z`);
    const toDate = new Date(`${to}T00:00:00Z`);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      errors.push('from/to son fechas inválidas');
    } else if (fromDate > toDate) {
      errors.push('from no puede ser posterior a to');
    } else {
      const diffDays = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24));
      if (diffDays > 90) errors.push('el rango máximo permitido es 90 días');
    }
  }

  if (errors.length > 0) return errorResponse(res, 'Error de validación', 400, errors);
  next();
};

module.exports = { validateSchedule, validateException, validateSlotsQuery };
