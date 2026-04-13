const request = require('supertest');
const app = require('../src/app');
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

let token;
let productId;

beforeAll(async () => {
  // 清除测试数据
  await User.deleteMany({});
  await Product.deleteMany({});

  // 注册并登录用户
  await request(app).post('/api/users/register').send(testUser);
  const loginResponse = await request(app).post('/api/users/login').send({
    email: testUser.email,
    password: testUser.password
  });
  token = loginResponse.body.token;
});

describe('Product Routes', () => {
  // 测试创建产品
  test('should create a new product', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(testProduct);
    
    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('产品创建成功');
    expect(response.body.product.name).toBe(testProduct.name);
    productId = response.body.product._id;
  });

  // 测试获取所有产品
  test('should get all products', async () => {
    const response = await request(app).get('/api/products');
    
    expect(response.statusCode).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.products.length).toBe(1);
  });

  // 测试获取单个产品
  test('should get a single product', async () => {
    const response = await request(app).get(`/api/products/${productId}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe(testProduct.name);
  });

  // 测试更新产品
  test('should update a product', async () => {
    const response = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Product',
        price: 149.99
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('产品更新成功');
    expect(response.body.product.name).toBe('Updated Product');
    expect(response.body.product.price).toBe(149.99);
  });

  // 测试删除产品
  test('should delete a product', async () => {
    const response = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('产品删除成功');
  });

  // 测试获取所有分类
  test('should get all categories', async () => {
    // 创建一个产品用于测试分类
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(testProduct);

    const response = await request(app).get('/api/products/categories/all');
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Electronics');
  });

  // 测试获取所有标签
  test('should get all tags', async () => {
    const response = await request(app).get('/api/products/tags/all');
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('test');
    expect(response.body).toContain('electronics');
  });
});