const db = require('../config/database');

const apiAuth = async (req, res, next) => {
  const appId = req.headers['x-app-id'];
  const appSecret = req.headers['x-app-secret'];
  const apiKey = req.headers['x-api-key'];
  const apiSecret = req.headers['x-api-secret'];

  if (!apiKey && (!appId || !appSecret)) {
    return res.status(401).json({ error: '缺少API密钥' });
  }

  try {
    let customer = null;
    let accountId = null;

    if (apiKey && apiSecret) {
      const keyRecord = db.apiKeys.findByApiKey(apiKey);
      if (!keyRecord || keyRecord.apiSecret !== apiSecret) {
        return res.status(401).json({ error: 'API密钥无效' });
      }

      if (keyRecord.status !== 'active') {
        return res.status(403).json({ error: 'API密钥已被禁用' });
      }

      if (keyRecord.accountId) {
        accountId = keyRecord.accountId;
        const account = db.accounts.findById(accountId);
        if (!account || account.status !== 'active') {
          return res.status(403).json({ error: '账号已被禁用' });
        }
        const binding = db.accountCustomers.findOne({
          accountId,
          customerId: keyRecord.customerId,
          status: 'active'
        });
        if (!binding) {
          return res.status(403).json({ error: '无权限访问该企业' });
        }
        customer = db.customers.findById(keyRecord.customerId);
        req.keyRecord = keyRecord;
        req.accountId = accountId;
      } else if (keyRecord.customerId) {
        customer = db.customers.findById(keyRecord.customerId);
        if (!customer || customer.status !== 'active') {
          return res.status(403).json({ error: '账号已被禁用' });
        }
        req.keyRecord = keyRecord;
      } else {
        return res.status(401).json({ error: 'API密钥未正确配置' });
      }
    } else if (appId && appSecret) {
      customer = db.customers.findOne({ appId, appSecret });
      if (!customer) {
        return res.status(401).json({ error: 'API密钥无效' });
      }

      if (customer.status === 'inactive') {
        return res.status(403).json({ error: '账号已被禁用' });
      }
    } else {
      return res.status(401).json({ error: '缺少API密钥' });
    }

    req.customer = customer;
    next();
  } catch (error) {
    console.error('apiAuth error:', error);
    res.status(500).json({ error: '认证失败' });
  }
};

module.exports = apiAuth;