const express = require('express');
const statsController = require('../controllers/statsController');
const auth = require('../middleware/auth');
const customerAuth = require('../middleware/customerAuth');

const router = express.Router();

router.get('/overview', auth, statsController.getOverview);

router.get('/products', auth, statsController.getProductStats);

router.get('/customers', auth, statsController.getCustomerStats);

router.get('/usage', customerAuth, statsController.getCustomerUsage);

router.get('/bills', customerAuth, statsController.getCustomerBills);

module.exports = router;