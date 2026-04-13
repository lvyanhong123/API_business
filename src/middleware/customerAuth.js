const jwt = require('jsonwebtoken');
const db = require('../config/database');

const customerAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: '未授权，请登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = db.customers.findById(decoded.id);
    if (!customer) {
      return res.status(401).json({ message: '客户不存在' });
    }

    if (customer.status === 'inactive') {
      return res.status(403).json({ message: '账号已被禁用' });
    }

    req.customer = customer;
    next();
  } catch (error) {
    res.status(401).json({ message: '令牌无效' });
  }
};

module.exports = customerAuth;