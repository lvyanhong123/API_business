const express = require('express');
const apiGatewayController = require('../controllers/apiGatewayController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/call', apiGatewayController.proxy);
router.get('/channels', apiGatewayController.getChannels);
router.get('/mappings', auth, apiGatewayController.getMappings);
router.post('/mappings', auth, apiGatewayController.addMapping);
router.delete('/mappings/:id', auth, apiGatewayController.deleteMapping);

module.exports = router;