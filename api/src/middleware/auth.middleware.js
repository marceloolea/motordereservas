const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Token no proporcionado', 401);
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expirado', 401);
    }
    return errorResponse(res, 'Token inválido', 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'No autenticado', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'No tienes permisos para esta acción', 403);
    }

    next();
  };
};

module.exports = { authenticate, authorize };