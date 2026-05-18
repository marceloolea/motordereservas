const { errorResponse } = require('../utils/response');

const ALLOWED_TYPES = ['psychologist', 'teacher'];

const validateProfile = (req, res, next) => {
  const errors = [];
  const {
    bio,
    specialization,
    professional_type,
    hourly_rate,
    experience_years,
    slot_duration_minutes
  } = req.body;

  if (professional_type === undefined || professional_type === null || professional_type === '') {
    errors.push('professional_type es requerido');
  } else if (!ALLOWED_TYPES.includes(professional_type)) {
    errors.push(`professional_type debe ser uno de: ${ALLOWED_TYPES.join(', ')}`);
  }

  if (!specialization || typeof specialization !== 'string' || specialization.trim().length < 2) {
    errors.push('specialization es requerida (mínimo 2 caracteres)');
  } else if (specialization.length > 150) {
    errors.push('specialization no puede superar 150 caracteres');
  }

  if (bio !== undefined && bio !== null) {
    if (typeof bio !== 'string') {
      errors.push('bio debe ser texto');
    } else if (bio.length > 2000) {
      errors.push('bio no puede superar 2000 caracteres');
    }
  }

  if (hourly_rate !== undefined && hourly_rate !== null && hourly_rate !== '') {
    const rate = Number(hourly_rate);
    if (Number.isNaN(rate) || rate < 0) {
      errors.push('hourly_rate debe ser un número mayor o igual a 0');
    }
  }

  if (experience_years !== undefined && experience_years !== null && experience_years !== '') {
    const years = Number(experience_years);
    if (!Number.isInteger(years) || years < 0 || years > 80) {
      errors.push('experience_years debe ser un entero entre 0 y 80');
    }
  }

  if (slot_duration_minutes !== undefined && slot_duration_minutes !== null && slot_duration_minutes !== '') {
    const dur = Number(slot_duration_minutes);
    if (!Number.isInteger(dur) || dur <= 0 || dur > 480) {
      errors.push('slot_duration_minutes debe ser un entero entre 1 y 480');
    }
  }

  if (errors.length > 0) {
    return errorResponse(res, 'Error de validación', 400, errors);
  }

  next();
};

module.exports = { validateProfile };
