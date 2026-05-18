const express = require('express');
const {
  upsertProfile,
  getMyProfile,
  getPublicProfile,
  listProfiles
} = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateProfile } = require('../middleware/validate-profile');

const router = express.Router();

console.log('✅ Rutas de perfiles cargadas');

router.get('/', listProfiles);
router.get('/me', authenticate, getMyProfile);
router.get('/:id', getPublicProfile);

router.post('/', authenticate, validateProfile, upsertProfile);
router.put('/', authenticate, validateProfile, upsertProfile);

module.exports = router;
