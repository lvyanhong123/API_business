const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

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

const db = require('./config/database');
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