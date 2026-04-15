const express = require('express');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, orderController.createOrder);
router.get('/', auth, orderController.getOrders);
router.get('/all', auth, orderController.getAllOrders);
router.get('/:id', auth, orderController.getOrder);
router.put('/:id/approve', auth, orderController.approveOrder);
router.put('/:id/reject', auth, orderController.rejectOrder);

module.exports = router;