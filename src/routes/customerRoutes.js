const express = require('express');
const { body } = require('express-validator');
const customerController = require('../controllers/customerController');
const customerAuth = require('../middleware/customerAuth');

const router = express.Router();

router.post('/register', [
  body('companyName', '企业名称不能为空').not().isEmpty(),
  body('businessLicense', '营业执照号不能为空').not().isEmpty(),
  body('contact.email', '邮箱不能为空').not().isEmpty(),
  body('contact.phone', '联系电话不能为空').not().isEmpty(),
  body('password', '密码长度不能少于6位').isLength({ min: 6 })
], customerController.register);

router.post('/login', [
  body('businessLicense', '营业执照号不能为空').not().isEmpty(),
  body('password', '密码不能为空').not().isEmpty()
], customerController.login);

router.get('/profile', customerAuth, customerController.getProfile);

router.get('/api-keys', customerAuth, customerController.getApiKeys);

router.post('/api-keys', customerAuth, customerController.regenerateApiKey);

router.get('/quota', customerAuth, customerController.getQuota);

module.exports = router;