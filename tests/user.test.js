const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

// 测试用户数据
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

let token;

beforeAll(async () => {
  // 清除测试数据
  await User.deleteMany({});
});

describe('User Routes', () => {
  // 测试用户注册
  test('should register a new user', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send(testUser);
    
    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('注册成功');
    expect(response.body.user.username).toBe(testUser.username);
    expect(response.body.user.email).toBe(testUser.email);
  });

  // 测试用户登录
  test('should login a user', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('登录成功');
    expect(response.body.token).toBeDefined();
    token = response.body.token;
  });

  // 测试获取用户信息
  test('should get user profile', async () => {
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.user.username).toBe(testUser.username);
    expect(response.body.user.email).toBe(testUser.email);
  });

  // 测试更新用户信息
  test('should update user profile', async () => {
    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'updateduser'
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('更新成功');
    expect(response.body.user.username).toBe('updateduser');
  });

  // 测试更新密码
  test('should update user password', async () => {
    const response = await request(app)
      .put('/api/users/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: testUser.password,
        newPassword: 'newpassword123'
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('密码更新成功');
  });
});