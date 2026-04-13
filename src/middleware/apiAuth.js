const db = require('../config/database');

const apiAuth = async (req, res, next) => {
  const appId = req.headers['x-app-id'];
  const appSecret = req.headers['x-app-secret'];

  if (!appId || !appSecret) {
    return res.status(401).json({ error: '缺少API密钥' });
  }

  try {
    const customer = db.customers.findOne({ appId, appSecret });

    if (!customer) {
      return res.status(401).json({ error: 'API密钥无效' });
    }

    if (customer.status === 'inactive') {
      return res.status(403).json({ error: '账号已被禁用' });
    }

    req.customer = customer;
    next();
  } catch (error) {
    res.status(500).json({ error: '认证失败' });
  }
};

module.exports = apiAuth;