const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./config/database');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

console.log('数据库加载成功（JSON文件存储）');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin/auth', adminRoutes);

const { accountAuth } = require('./middleware/accountAuth');

app.get('/api/my/account-info', accountAuth, async (req, res) => {
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

const supplierRoutes = require('./routes/supplierRoutes');
app.use('/api/admin/suppliers', supplierRoutes);

const channelRoutes = require('./routes/channelRoutes');
app.use('/api/admin/channels', channelRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/api/admin/products', productRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

const customerRoutes = require('./routes/customerRoutes');
app.use('/api/customers', customerRoutes);

const customerAccountRoutes = require('./routes/customerAccountRoutes');
app.use('/api/customers', customerAccountRoutes);

const apiKeyRoutes = require('./routes/apiKeyRoutes');
app.use('/api/admin/keys', apiKeyRoutes);

const apiProxyRoutes = require('./routes/apiProxyRoutes');
app.use('/api/v1', apiProxyRoutes);

const apiGatewayRoutes = require('./routes/apiGatewayRoutes');
app.use('/api/gateway', apiGatewayRoutes);

const statsRoutes = require('./routes/statsRoutes');
app.use('/api/stats', statsRoutes);

const callLogRoutes = require('./routes/callLogRoutes');
app.use('/api/admin/call-logs', callLogRoutes);

const billRoutes = require('./routes/billRoutes');
app.use('/api/admin/bills', billRoutes);

const customerBillRoutes = require('./routes/customerBillRoutes');
app.use('/api/admin/customer-bills', customerBillRoutes);

const adminAuth = require('./middleware/auth');

app.get('/api/customers', adminAuth, (req, res) => {
  const customers = db.customers.findAll().map(c => ({
    id: c.id,
    companyName: c.companyName,
    businessLicense: c.businessLicense,
    contact: c.contact,
    address: c.address,
    salesId: c.salesId,
    status: c.status,
    createdAt: c.createdAt
  }));
  res.json({ customers });
});

app.get('/api/customers/:id', adminAuth, (req, res) => {
  const customer = db.customers.findById(parseInt(req.params.id));
  if (!customer) return res.status(404).json({ message: '客户不存在' });
  res.json(customer);
});

app.post('/api/customers', adminAuth, (req, res) => {
  const { companyName, businessLicense, contact, address, salesId } = req.body;
  if (!companyName || !businessLicense || !contact?.name || !contact?.phone || !contact?.email) {
    return res.status(400).json({ message: '请填写完整信息' });
  }
  const existing = db.customers.findOne({ businessLicense });
  if (existing) {
    return res.status(400).json({ message: '该营业执照号已被注册' });
  }
  const customer = db.customers.create({
    companyName,
    businessLicense,
    contact,
    address: address || '',
    salesId: salesId || null,
    status: 'active'
  });
  db.customerAccounts.create({
    customerId: customer.id,
    balance: 0,
    creditLimit: 0
  });
  res.status(201).json(customer);
});

app.put('/api/customers/:id', adminAuth, (req, res) => {
  const { companyName, businessLicense, contact, address, salesId, status } = req.body;
  const customer = db.customers.findById(parseInt(req.params.id));
  if (!customer) return res.status(404).json({ message: '客户不存在' });
  const updated = db.customers.update(parseInt(req.params.id), {
    companyName: companyName || customer.companyName,
    businessLicense: businessLicense || customer.businessLicense,
    contact: contact || customer.contact,
    address: address !== undefined ? address : customer.address,
    salesId: salesId !== undefined ? salesId : customer.salesId,
    status: status || customer.status
  });
  res.json(updated);
});

app.get('/api/accounts', adminAuth, (req, res) => {
  const accounts = db.accounts.findAll().map(a => {
    const { password, ...rest } = a;
    return rest;
  });
  res.json(accounts);
});

app.post('/api/accounts', adminAuth, async (req, res) => {
  const { name, username, password } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ message: '请填写完整信息' });
  }
  const existing = db.accounts.findByUsername(username);
  if (existing) {
    return res.status(400).json({ message: '该手机号已注册' });
  }
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 10);
  const account = db.accounts.create({
    name,
    username,
    password: hashedPassword,
    status: 'active'
  });
  const { password: _, ...result } = account;
  res.status(201).json(result);
});

app.put('/api/accounts/:id', adminAuth, (req, res) => {
  const { status } = req.body;
  const account = db.accounts.update(parseInt(req.params.id), { status });
  if (!account) return res.status(404).json({ message: '账号不存在' });
  const { password, ...result } = account;
  res.json(result);
});

app.get('/api/account-customers', adminAuth, (req, res) => {
  const { status } = req.query;
  let bindings = db.accountCustomers.findAll();
  if (status) {
    bindings = bindings.filter(b => b.status === status);
  }
  bindings = bindings.map(b => {
    const account = db.accounts.findById(b.accountId);
    const customer = db.customers.findById(b.customerId);
    return {
      ...b,
      accountName: account?.name || '-',
      username: account?.username || '-',
      companyName: customer?.companyName || '-'
    };
  });
  res.json(bindings);
});

app.post('/api/account-customers', adminAuth, (req, res) => {
  const { accountId, customerId, role, status } = req.body;
  if (!accountId || !customerId) {
    return res.status(400).json({ message: '请填写完整信息' });
  }
  const existing = db.accountCustomers.findOne({ accountId, customerId });
  if (existing) {
    return res.status(400).json({ message: '该绑定关系已存在' });
  }
  const binding = db.accountCustomers.create({
    accountId,
    customerId,
    role: role || 'member',
    status: status || 'pending'
  });
  res.status(201).json(binding);
});

app.put('/api/account-customers/:id', adminAuth, (req, res) => {
  const { role, status } = req.body;
  const updateData = {};
  if (role !== undefined) updateData.role = role;
  if (status !== undefined) updateData.status = status;
  const binding = db.accountCustomers.update(parseInt(req.params.id), updateData);
  if (!binding) return res.status(404).json({ message: '绑定关系不存在' });
  res.json(binding);
});

app.delete('/api/account-customers/:id', adminAuth, (req, res) => {
  const success = db.accountCustomers.delete(parseInt(req.params.id));
  if (!success) return res.status(404).json({ message: '绑定关系不存在' });
  res.json({ message: '删除成功' });
});

app.post('/api/account-customers/:id/approve', adminAuth, (req, res) => {
  const binding = db.accountCustomers.update(parseInt(req.params.id), { status: 'active' });
  if (!binding) return res.status(404).json({ message: '绑定关系不存在' });
  res.json(binding);
});

app.get('/api/admin/customers', (req, res) => {
  const customers = db.customers.findAll().map(c => ({
    id: c.id,
    companyName: c.companyName,
    name: c.companyName,
    businessLicense: c.businessLicense,
    contact: c.contact,
    status: c.status,
    quota: c.quota,
    paymentType: c.paymentType,
    createdAt: c.createdAt
  }));
  res.json({ customers });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;