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

router.post('/accounts/:customerId/withdraw', auth, customerAccountController.withdraw);

router.get('/accounts/:customerId/withdraws', auth, customerAccountController.getWithdrawOrders);

router.get('/payment-orders', auth, customerAccountController.getAllPaymentOrders);

router.get('/withdraw-orders', auth, customerAccountController.getAllWithdrawOrders);

router.get('/accounts/:customerId/transactions', auth, customerAccountController.getTransactionRecords);

router.put('/payment-orders/:id', auth, customerAccountController.updatePaymentOrder);

router.delete('/payment-orders/:id', auth, customerAccountController.deletePaymentOrder);

router.put('/withdraw-orders/:id', auth, customerAccountController.updateWithdrawOrder);

router.delete('/withdraw-orders/:id', auth, customerAccountController.deleteWithdrawOrder);

module.exports = router;