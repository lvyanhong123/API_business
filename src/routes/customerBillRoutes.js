const express = require('express');
const customerBillController = require('../controllers/customerBillController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/generate', auth, customerBillController.generateBill);
router.get('/', auth, customerBillController.getBills);
router.get('/:id', auth, customerBillController.getBillDetail);
router.put('/:id/confirm', auth, customerBillController.confirmBill);
router.post('/auto-generate', auth, customerBillController.autoGenerateMonthlyBills);

module.exports = router;