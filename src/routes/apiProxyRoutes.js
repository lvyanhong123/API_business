const express = require('express');
const apiProxyController = require('../controllers/apiProxyController');
const apiAuth = require('../middleware/apiAuth');

const router = express.Router();

router.post('/:productCode', apiAuth, apiProxyController.invokeApi);

module.exports = router;