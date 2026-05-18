const express = require('express');
const { register, login, getProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

console.log('✅ Rutas de autenticación cargadas');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);

module.exports = router;
