const request = require('supertest');
const app = require('../src/app');
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

let token;
let productId;
let orderId;

beforeAll(async () => {
  // 清除测试数据
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});

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
});

describe('Order Routes', () => {
  // 测试创建订单
  test('should create a new order', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(testOrder);
    
    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('订单创建成功');
    expect(response.body.order.products.length).toBe(1);
    orderId = response.body.order._id;
  });

  // 测试获取用户订单列表
  test('should get user orders', async () => {
    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.orders.length).toBe(1);
  });

  // 测试获取单个订单
  test('should get a single order', async () => {
    const response = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(orderId);
  });

  // 测试更新订单状态
  test('should update order status', async () => {
    const response = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'processing' });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('订单状态更新成功');
    expect(response.body.order.status).toBe('processing');
  });
});