const express = require('express');
const customerAccountController = require('../controllers/customerAccountController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/accounts', auth, customerAccountController.getAllAccounts);

router.get('/accounts/:customerId', auth, customerAccountController.getAccount);

router.put('/accounts/:customerId', auth, customerAccountController.updateAccount);

router.post('/accounts/:customerId/deduct', auth, customerAccountController.deductBalance);

router.post('/accounts/:customerId/recharge', auth, customerAccountController.addBalance);

router.get('/accounts/:customerId/payments', auth, customerAccountController.getPaymentOrders);

router.post('/accounts/:customerId/refund', auth, customerAccountController.refund);

router.get('/accounts/:customerId/refunds', auth, customerAccountController.getRefundOrders);

module.exports = router;