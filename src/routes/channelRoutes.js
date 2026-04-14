const express = require('express');
const { body } = require('express-validator');
const channelController = require('../controllers/channelController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, [
  body('name', '通道名称不能为空').not().isEmpty(),
  body('supplierId', '供应商ID不能为空').not().isEmpty(),
  body('apiUrl', 'API地址不能为空').not().isEmpty(),
  body('authType', '认证方式不能为空').not().isEmpty()
], channelController.createChannel);

router.get('/', auth, channelController.getChannels);

router.get('/supplier/:supplierId', auth, channelController.getChannelsBySupplier);

router.get('/:id', auth, channelController.getChannel);

router.put('/:channelId/cost', auth, channelController.updateChannelCost);

router.put('/:id', auth, channelController.updateChannel);

router.delete('/:id', auth, channelController.deleteChannel);

module.exports = router;
