const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: '未授权，请登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = db.admins.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: '管理员不存在' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: '令牌无效' });
  }
};

const adminAuth = auth;

module.exports = auth;
module.exports.adminAuth = adminAuth;