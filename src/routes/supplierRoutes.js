const express = require('express');
const supplierController = require('../controllers/supplierController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, supplierController.createSupplier);

router.get('/', auth, supplierController.getSuppliers);

router.get('/:id', auth, supplierController.getSupplier);

router.put('/:id', auth, supplierController.updateSupplier);

router.delete('/:id', auth, supplierController.deleteSupplier);

module.exports = router;