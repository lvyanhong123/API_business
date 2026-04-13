const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const customerAuth = require('../middleware/customerAuth');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', customerAuth, [
  body('product', '产品ID不能为空').not().isEmpty(),
  body('orderType', '订单类型不能为空').not().isEmpty(),
  body('quantity', '数量必须为正整数').optional().isInt({ min: 1 })
], orderController.createOrder);

router.get('/', customerAuth, orderController.getOrders);

router.get('/all', auth, orderController.getAllOrders);

router.get('/:id', customerAuth, orderController.getOrder);

router.put('/:id/approve', auth, orderController.approveOrder);

router.put('/:id/reject', auth, [
  body('reason', '拒绝原因').optional()
], orderController.rejectOrder);

module.exports = router;