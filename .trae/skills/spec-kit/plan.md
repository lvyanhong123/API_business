# API商业化平台技术实现计划

## 技术栈选择
- **后端框架**：Express.js（Node.js）
- **数据库**：MongoDB + Mongoose
- **认证**：JWT（管理员）+ API密钥（客户）
- **HTTP客户端**：axios（用于转发请求到供应商）
- **测试**：Jest
- **部署**：Docker

## 项目结构
```
API_business/
├── src/
│   ├── app.js                    # 应用入口
│   ├── config/                   # 配置文件
│   │   └── swagger.js           # Swagger配置
│   ├── models/                   # 数据模型
│   │   ├── Admin.js             # 管理员模型
│   │   ├── Supplier.js          # 供应商模型
│   │   ├── Product.js           # 产品模型
│   │   ├── Customer.js          # 客户模型
│   │   ├── Order.js             # 订单模型
│   │   └── ApiLog.js            # 调用日志模型
│   ├── routes/                   # 路由
│   │   ├── adminRoutes.js        # 管理员认证路由
│   │   ├── supplierRoutes.js    # 供应商路由
│   │   ├── productRoutes.js     # 产品路由
│   │   ├── customerRoutes.js    # 客户路由
│   │   ├── orderRoutes.js       # 订单路由
│   │   ├── apiProxyRoutes.js     # API网关路由
│   │   └── statsRoutes.js       # 统计路由
│   ├── controllers/              # 控制器
│   │   ├── adminController.js
│   │   ├── supplierController.js
│   │   ├── productController.js
│   │   ├── customerController.js
│   │   ├── orderController.js
│   │   ├── apiProxyController.js
│   │   └── statsController.js
│   ├── middleware/                # 中间件
│   │   ├── auth.js               # 管理员认证
│   │   ├── customerAuth.js       # 客户认证
│   │   └── apiAuth.js            # API密钥认证
│   ├── services/                  # 业务逻辑
│   │   └── proxyService.js       # API转发服务
│   └── utils/                     # 工具函数
├── tests/                        # 测试文件
├── .env                          # 环境变量
├── package.json
└── Dockerfile
```

## 系统端划分

### 1. 管理后台 API
- 供应商管理 CRUD
- 产品管理 CRUD
- 订单审核（通过/拒绝）
- 运营统计

### 2. 客户后台 API
- 注册 / 登录
- 下单购买
- 查看订单
- API密钥管理
- 用量统计 / 账单

### 3. API网关
- 接收并转发API调用请求
- API密钥验证
- 计费扣减
- 调用日志记录

## 数据模型

### Admin (管理员)
- username, password, role

### Supplier (供应商)
- name, type, apiUrl, authType, authConfig, contact, status

### Product (产品)
- code, name, description, supplier
- pricingType (per_call/subscription)
- pricePerCall, subscriptionPrice
- dailyLimit, monthlyLimit
- status (online/offline)

### Customer (客户)
- companyName, businessLicense, contact, password
- appId, appSecret, quota, status

### Order (订单)
- orderNo, customer, product
- orderType, quantity, amount
- validFrom, validTo
- reviewStatus (pending/approved/rejected)
- paymentStatus (pending/paid/expired/cancelled)

### ApiLog (调用日志)
- customer, product, supplier
- requestParams, responseData
- statusCode, success, duration, fee

## API路由清单

### 管理后台
- `POST /api/admin/auth/login` - 管理员登录
- `POST /api/admin/auth/register` - 管理员注册
- `POST /api/admin/suppliers` - 创建供应商
- `GET /api/admin/suppliers` - 获取供应商列表
- `GET /api/admin/suppliers/:id` - 获取供应商详情
- `PUT /api/admin/suppliers/:id` - 更新供应商
- `DELETE /api/admin/suppliers/:id` - 删除供应商
- `POST /api/admin/products` - 创建产品
- `GET /api/admin/products` - 获取产品列表
- `GET /api/admin/products/:id` - 获取产品详情
- `PUT /api/admin/products/:id` - 更新产品
- `DELETE /api/admin/products/:id` - 删除产品
- `GET /api/orders/all` - 获取所有订单
- `PUT /api/orders/:id/approve` - 审核通过
- `PUT /api/orders/:id/reject` - 审核拒绝
- `GET /api/stats/overview` - 平台概览
- `GET /api/stats/products` - 产品统计
- `GET /api/stats/customers` - 客户统计

### 客户后台
- `POST /api/customers/register` - 客户注册
- `POST /api/customers/login` - 客户登录
- `GET /api/customers/profile` - 获取客户信息
- `GET /api/customers/api-keys` - 获取API密钥
- `POST /api/customers/api-keys` - 重新生成API密钥
- `GET /api/customers/quota` - 获取配额
- `POST /api/orders` - 创建订单
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `GET /api/stats/usage` - 用量查询
- `GET /api/stats/bills` - 账单查询

### API网关
- `POST /api/v1/:productCode` - 调用API接口