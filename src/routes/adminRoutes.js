const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.post('/login', [
  body('username', '用户名不能为空').not().isEmpty(),
  body('password', '密码不能为空').not().isEmpty()
], adminController.login);

router.post('/register', [
  body('username', '用户名不能为空').not().isEmpty(),
  body('password', '密码长度不能少于6位').isLength({ min: 6 })
], adminController.register);

module.exports = router;