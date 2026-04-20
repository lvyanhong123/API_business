const express = require('express');
const path = require('path');
require('dotenv').config();
const customerController = require('./controllers/customerController');
const customerAuth = require('./middleware/customerAuth');
const { accountAuth } = require('./middleware/accountAuth');
const db = require('./config/database');
const accountRoutes = require('./routes/accountRoutes');
const accountQuotaRoutes = require('./routes/accountQuotaRoutes');

const customerApp = express();
customerApp.use(express.json());
customerApp.use(express.static(path.join(__dirname, '../public')));

customerApp.use('/api/accounts', accountRoutes);

customerApp.use('/api/my', accountQuotaRoutes);

customerApp.post('/api/customers/register', customerController.register);
customerApp.post('/api/customers/login', customerController.login);
customerApp.get('/api/customers/profile', customerAuth, customerController.getProfile);
customerApp.get('/api/customers/apikeys', customerAuth, customerController.getApiKeys);
customerApp.post('/api/customers/regenerate-apikey', customerAuth, customerController.regenerateApiKey);
customerApp.get('/api/customers/quota', customerAuth, customerController.getQuota);

customerApp.get('/api/products', async (req, res) => {
  try {
    const products = db.products.findAll().map(p => {
      const supplier = db.suppliers.findById(p.supplierId);
      return { ...p, supplier: supplier ? { id: supplier.id, name: supplier.name } : null };
    });
    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

customerApp.get('/api/orders', accountAuth, async (req, res) => {
  try {
    const accountCustomers = db.accountCustomers.findByAccountId(req.account.id);
    if (!accountCustomers || accountCustomers.length === 0) {
      return res.status(200).json({ orders: [] });
    }
    const customerId = accountCustomers[0].customerId;
    let orders = db.orders.findAll().filter(o => o.customerId === customerId);
    orders = orders.map(o => {
      const p = db.products.findById(o.productId);
      return { ...o, product: p ? { id: p.id, code: p.code, name: p.name, pricingType: p.pricingType } : null };
    });
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

customerApp.post('/api/orders', accountAuth, async (req, res) => {
  const { product, orderType, quantity = 1, paymentType, paymentMethod = 'balance' } = req.body;

  if (!product || !orderType) {
    return res.status(400).json({ message: '请选择产品和订单类型' });
  }

  if (!paymentType || !['prepay', 'postpay'].includes(paymentType)) {
    return res.status(400).json({ message: '请选择支付类型（prepay 或 postpay）' });
  }

  if (!['balance', 'credit'].includes(paymentMethod)) {
    return res.status(400).json({ message: '请选择支付账户（balance 或 credit）' });
  }

  try {
    const accountCustomers = db.accountCustomers.findByAccountId(req.account.id);
    if (!accountCustomers || accountCustomers.length === 0) {
      return res.status(403).json({ message: '该账号未绑定企业' });
    }
    const customerId = accountCustomers[0].customerId;

    const productInfo = db.products.findById(product);
    if (!productInfo) {
      return res.status(404).json({ message: '产品不存在' });
    }

    if (productInfo.status !== 'online') {
      return res.status(400).json({ message: '产品已下线' });
    }

    let amount = 0;
    if (orderType === 'per_call') {
      amount = productInfo.pricePerCall * quantity;
    } else if (orderType === 'subscription') {
      amount = productInfo.subscriptionPrice * quantity;
    }

    const orderNo = 'ORD' + Date.now() + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const order = db.orders.create({
      orderNo,
      customerId,
      accountId: req.account.id,
      productId: product,
      orderType,
      quantity,
      amount,
      paymentType,
      paymentMethod,
      reviewStatus: 'pending',
      paymentStatus: 'pending'
    });

    res.status(201).json({ message: '订单创建成功', order });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

customerApp.get('/api/call-logs', customerAuth, async (req, res) => {
  try {
    let logs = db.apiLogs.findAll().filter(l => l.customerId === req.customer.id);
    logs = logs.map(l => {
      const p = db.products.findById(l.productId);
      return { ...l, productName: p ? p.name : '-' };
    });
    logs.sort((a, b) => new Date(b.callTime) - new Date(a.callTime));
    const total = logs.length;
    const limit = 50;
    const paginatedLogs = logs.slice(0, limit);
    res.status(200).json({ total, logs: paginatedLogs });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

customerApp.get('/api/my/account-info', accountAuth, async (req, res) => {
  try {
    const accountCustomers = db.accountCustomers.findByAccountId(req.account.id);
    if (!accountCustomers || accountCustomers.length === 0) {
      return res.status(404).json({ message: '该账号未绑定企业' });
    }
    const customerId = accountCustomers[0].customerId;
    let account = db.customerAccounts.findByCustomerId(customerId);
    if (!account) {
      account = db.customerAccounts.create({
        customerId,
        balance: 0,
        creditLimit: 0
      });
    }
    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

customerApp.get('/api/accounts/:customerId', customerAuth, async (req, res) => {
  try {
    if (parseInt(req.params.customerId) !== req.customer.id) {
      return res.status(403).json({ message: '无权访问' });
    }
    let account = db.customerAccounts.findByCustomerId(req.customer.id);
    if (!account) {
      const customer = db.customers.findById(req.customer.id);
      account = db.customerAccounts.create({
        customerId: req.customer.id,
        balance: 0,
        creditLimit: 0,
        paymentType: customer.paymentType || 'prepay'
      });
    }
    res.status(200).json(account);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

customerApp.get('/api/keys/customer', customerAuth, async (req, res) => {
  try {
    const keys = db.apiKeys.findByCustomerId(req.customer.id);
    const enrichedKeys = keys.map(k => {
      const product = db.products.findById(k.productId);
      return {
        ...k,
        productName: product ? product.name : '-',
        productCode: product ? product.code : '-'
      };
    });
    res.status(200).json({ keys: enrichedKeys });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

customerApp.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/client.html'));
});

const PORT = 3001;
customerApp.listen(PORT, () => {
  console.log(`客户自助门户运行在端口 ${PORT}`);
});

module.exports = customerApp;