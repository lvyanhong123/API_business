const request = require('supertest');
const app = require('../src/app');
const Payment = require('../src/models/Payment');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');
const User = require('../src/models/User');

// 测试用户数据
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

// 测试产品数据
const testProduct = {
  name: 'Test Product',
  description: 'This is a test product',
  price: 99.99,
  stock: 100,
  category: 'Electronics',
  tags: ['test', 'electronics']
};

// 测试订单数据
const testOrder = {
  products: [
    {
      product: '', // 会在测试中填充
      quantity: 2
    }
  ],
  shippingAddress: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'USA'
  },
  paymentMethod: 'Credit Card'
};

// 测试支付数据
const testPayment = {
  orderId: '', // 会在测试中填充
  amount: 199.98, // 2 * 99.99
  method: 'Credit Card'
};

let token;
let productId;
let orderId;
let paymentId;

beforeAll(async () => {
  // 清除测试数据
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  await Payment.deleteMany({});

  // 注册并登录用户
  await request(app).post('/api/users/register').send(testUser);
  const loginResponse = await request(app).post('/api/users/login').send({
    email: testUser.email,
    password: testUser.password
  });
  token = loginResponse.body.token;

  // 创建测试产品
  const productResponse = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token}`)
    .send(testProduct);
  productId = productResponse.body.product._id;
  testOrder.products[0].product = productId;

  // 创建测试订单
  const orderResponse = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send(testOrder);
  orderId = orderResponse.body.order._id;
  testPayment.orderId = orderId;
});

describe('Payment Routes', () => {
  // 测试创建支付
  test('should create a new payment', async () => {
    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send(testPayment);
    
    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('支付成功');
    expect(response.body.payment.status).toBe('success');
    paymentId = response.body.payment._id;
  });

  // 测试获取支付状态
  test('should get payment status', async () => {
    const response = await request(app)
      .get(`/api/payments/${paymentId}/status`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.status).toBe('success');
  });

  // 测试获取用户支付历史
  test('should get user payment history', async () => {
    const response = await request(app)
      .get('/api/payments/history')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.payments.length).toBe(1);
  });

  // 测试支付回调
  test('should handle payment callback', async () => {
    const response = await request(app)
      .post('/api/payments/callback')
      .send({
        paymentId: 'PAY1234567890',
        transactionId: 'TXN1234567890',
        status: 'success'
      });
    
    expect(response.statusCode).toBe(404); // 因为支付 ID 不存在
  });
});