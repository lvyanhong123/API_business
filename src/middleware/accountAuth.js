const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.accountAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '未登录' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.accountId) {
      return res.status(401).json({ message: '无效的令牌' });
    }

    const account = db.accounts.findById(decoded.accountId);
    if (!account) {
      return res.status(401).json({ message: '账号不存在' });
    }

    if (account.status === 'inactive') {
      return res.status(403).json({ message: '账号已被禁用' });
    }

    req.account = account;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '令牌已过期' });
    }
    return res.status(401).json({ message: '认证失败' });
  }
};

exports.customerAdminAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '未登录' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.accountId) {
      return res.status(401).json({ message: '无效的令牌' });
    }

    const account = db.accounts.findById(decoded.accountId);
    if (!account) {
      return res.status(401).json({ message: '账号不存在' });
    }

    if (account.status === 'inactive') {
      return res.status(403).json({ message: '账号已被禁用' });
    }

    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({ message: '请提供企业ID' });
    }

    const binding = db.accountCustomers.findOne({
      accountId: account.id,
      customerId: parseInt(customerId),
      role: 'admin',
      status: 'active'
    });

    if (!binding) {
      return res.status(403).json({ message: '无权限操作该企业' });
    }

    req.account = account;
    req.customerId = parseInt(customerId);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '令牌已过期' });
    }
    return res.status(401).json({ message: '认证失败' });
  }
};
