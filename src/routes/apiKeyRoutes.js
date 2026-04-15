const express = require('express');
const apiKeyController = require('../controllers/apiKeyController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, apiKeyController.getKeys);

router.get('/customer', auth, apiKeyController.getCustomerKeys);

router.put('/:id/revoke', auth, apiKeyController.revokeKey);

module.exports = router;