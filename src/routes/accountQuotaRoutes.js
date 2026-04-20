const express = require('express');
const router = express.Router();
const accountQuotaController = require('../controllers/accountQuotaController');
const { accountAuth } = require('../middleware/accountAuth');

router.get('/quotas', accountAuth, accountQuotaController.getMyQuotas);

router.post('/auto-renewal', accountAuth, accountQuotaController.saveAutoRenewal);

router.delete('/auto-renewal/:productId', accountQuotaController.disableAutoRenewal);

module.exports = router;