const { errorResponse } = require('../utils/response');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

const normalizeTime = (t) => {
  if (!t) return t;
  const parts = t.split(':');
  return `${parts[0].padStart(2, '0')}:${parts[1]}`;
};

const validateCreateBooking = (req, res, next) => {
  const errors = [];
  const { professional_id, booking_date, start_time, notes } = req.body;

  if (!professional_id || !UUID_REGEX.test(professional_id)) {
    errors.push('professional_id es requerido (UUID)');
  }

  if (!booking_date || !DATE_REGEX.test(booking_date)) {
    errors.push('booking_date es requerido (YYYY-MM-DD)');
  }

  if (!start_time || !TIME_REGEX.test(start_time)) {
    errors.push('start_time es requerido (HH:MM)');
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.push('notes debe ser texto');
    } else if (notes.length > 1000) {
      errors.push('notes no puede superar 1000 caracteres');
    }
  }

  if (errors.length > 0) return errorResponse(res, 'Error de validación', 400, errors);

  req.body.start_time = normalizeTime(start_time);
  next();
};

const validateCancel = (req, res, next) => {
  const { reason } = req.body || {};
  if (reason !== undefined && reason !== null) {
    if (typeof reason !== 'string') {
      return errorResponse(res, 'Error de validación', 400, ['reason debe ser texto']);
    }
    if (reason.length > 500) {
      return errorResponse(res, 'Error de validación', 400, ['reason no puede superar 500 caracteres']);
    }
  }
  next();
};

module.exports = { validateCreateBooking, validateCancel };
