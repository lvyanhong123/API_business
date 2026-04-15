const express = require('express');
const customerController = require('../controllers/customerController');
const customerAuth = require('../middleware/customerAuth');

const router = express.Router();

router.post('/register', customerController.register);
router.post('/login', customerController.login);
router.get('/profile', customerAuth, customerController.getProfile);
router.get('/api-keys', customerAuth, customerController.getApiKeys);
router.post('/api-keys', customerAuth, customerController.regenerateApiKey);
router.get('/quota', customerAuth, customerController.getQuota);

module.exports = router;