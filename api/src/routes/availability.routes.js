const express = require('express');
const {
  createSchedule, listMySchedules, updateSchedule, deleteSchedule,
  createException, listMyExceptions, deleteException,
  getSlots
} = require('../controllers/availability.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  validateSchedule, validateException, validateSlotsQuery
} = require('../middleware/validate-availability');

const router = express.Router();

console.log('✅ Rutas de disponibilidad cargadas');

// Schedules (patrones semanales)
router.post('/schedules', authenticate, validateSchedule, createSchedule);
router.get('/schedules/me', authenticate, listMySchedules);
router.put('/schedules/:id', authenticate, validateSchedule, updateSchedule);
router.delete('/schedules/:id', authenticate, deleteSchedule);

// Exceptions (overrides por fecha)
router.post('/exceptions', authenticate, validateException, createException);
router.get('/exceptions/me', authenticate, listMyExceptions);
router.delete('/exceptions/:id', authenticate, deleteException);

// Slots (público)
router.get('/:userId/slots', validateSlotsQuery, getSlots);

module.exports = router;
