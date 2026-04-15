const express = require('express');
const billController = require('../controllers/billController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, billController.getBills);

router.get('/:id', auth, billController.getBill);

router.post('/generate', auth, billController.generateBill);

router.get('/supplier/:supplierId/settlement', auth, billController.getSupplierSettlement);

module.exports = router;