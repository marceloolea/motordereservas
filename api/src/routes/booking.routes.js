const express = require('express');
const {
  createBooking, listMyBookings, getBookingById,
  confirmBooking, cancelBooking, completeBooking
} = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateCreateBooking, validateCancel } = require('../middleware/validate-booking');

const router = express.Router();

console.log('✅ Rutas de reservas cargadas');

router.post('/', authenticate, validateCreateBooking, createBooking);
router.get('/me', authenticate, listMyBookings);
router.get('/:id', authenticate, getBookingById);
router.patch('/:id/confirm', authenticate, confirmBooking);
router.patch('/:id/cancel', authenticate, validateCancel, cancelBooking);
router.patch('/:id/complete', authenticate, completeBooking);

module.exports = router;
