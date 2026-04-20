const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { accountAuth } = require('../middleware/accountAuth');

router.post('/register', accountController.register);

router.post('/login', accountController.login);

router.get('/profile', accountAuth, accountController.getProfile);

router.post('/customers', accountAuth, accountController.createCustomer);

router.post('/bind-customer', accountAuth, accountController.applyBindCustomer);

router.get('/pending-binds', accountAuth, accountController.listPendingBinds);

router.get('/customers/:customerId/accounts', accountAuth, accountController.listCustomerAccounts);

router.post('/approve-bind/:bindingId', accountAuth, accountController.approveBind);

router.post('/reject-bind/:bindingId', accountAuth, accountController.rejectBind);

router.post('/change-admin', accountAuth, accountController.changeAdmin);

router.delete('/unbind-customer/:bindingId', accountAuth, accountController.unbindCustomer);

router.get('/apikeys', accountAuth, accountController.getApiKeys);

router.post('/regenerate-apikey', accountAuth, accountController.regenerateApiKey);

router.get('/my-applications', accountAuth, accountController.getMyPendingApplications);

module.exports = router;
