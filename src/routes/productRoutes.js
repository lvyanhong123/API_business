const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, [
  body('code', '产品编码不能为空').not().isEmpty(),
  body('name', '产品名称不能为空').not().isEmpty(),
  body('supplier', '供应商ID不能为空').not().isEmpty(),
  body('pricingType', '计费类型不能为空').not().isEmpty()
], productController.createProduct);

router.get('/', auth, productController.getProducts);

router.get('/:id', auth, productController.getProduct);

router.put('/:id', auth, productController.updateProduct);

router.delete('/:id', auth, productController.deleteProduct);

module.exports = router;