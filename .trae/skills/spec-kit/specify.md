# API商业化平台需求规格说明

## 业务背景
公司从事API商业化业务，需要接入多个供应商的API接口（如实名认证、人脸识别、地图服务、天气服务等），经过封装后为企业客户提供统一的API服务。

## 系统端划分

### 1. 管理后台
- 供应商管理
- API产品管理（含计费规则配置）
- 客户管理
- 订单审核（管理员手动审核）
- 运营统计

### 2. 客户后台
- 注册 / 登录
- 下单购买API服务
- 查看订单审核状态
- 获取API密钥（审核通过后）
- 查看账单和用量

### 3. API网关
- 接收并转发API调用请求
- 验证API密钥
- 计费扣减
- 返回供应商响应

## 业务流程
```
1. 企业客户与平台签订合同
2. 企业在客户后注册账号
3. 企业客户自主下单
4. 管理员在管理后台审核订单
5. 审核通过后，企业客户获取API密钥
6. 企业客户通过API网关调用接口
7. 系统根据计费规则扣减费用
```

## 核心功能需求

### 供应商管理
- **供应商注册** - 添加供应商基本信息（名称、类型、联系方式）
- **供应商类型** - 支持短信服务、支付接口、地图服务、AI服务、实名认证等多种类型
- **供应商状态** - 启用/禁用供应商接口

### API产品管理
- **产品创建** - 将供应商API封装成平台产品
- **产品配置** - 配置API参数、请求格式、响应格式
- **计费规则** - 支持按调用次数计费和包月订阅
- **调用限制** - 设置日调用上限、月调用上限
- **产品上线/下线** - 控制产品的可用性

### 订单管理
- **客户下单** - 客户选择产品并下单
- **订单类型** - 支持按量付费订单和包月订阅订单
- **订单状态** - 待审核/审核通过/审核拒绝/待支付/已支付/已过期/已取消
- **管理员审核** - 管理员手动审核订单
- **密钥发放** - 审核通过后自动触发API密钥生成或配额发放

### 客户管理
- **客户注册** - 企业客户注册账号
- **客户认证** - 企业实名认证（营业执照等）
- **API密钥** - 为客户生成API密钥（AppId + AppSecret），审核通过后发放
- **客户状态** - 启用/禁用客户账号
- **配额管理** - 客户的API调用配额

### API网关
- **请求接收** - 接收客户API调用请求
- **身份验证** - 验证客户API密钥
- **用量检查** - 检查客户剩余配额/订阅状态
- **请求转发** - 将请求转发到供应商API
- **响应返回** - 将供应商响应返回给客户
- **计费记录** - 记录调用次数和费用

### 用量统计
- **实时调用量** - 展示API实时调用情况
- **客户用量查询** - 客户查看自己的API调用记录
- **费用统计** - 统计各产品的收入情况
- **账单生成** - 生成客户月度账单

## API接口清单

### 管理后台 API

#### 供应商管理
- `POST /api/admin/suppliers` - 创建供应商
- `GET /api/admin/suppliers` - 获取供应商列表
- `GET /api/admin/suppliers/:id` - 获取供应商详情
- `PUT /api/admin/suppliers/:id` - 更新供应商信息
- `DELETE /api/admin/suppliers/:id` - 删除供应商

#### 产品管理
- `POST /api/admin/products` - 创建产品
- `GET /api/admin/products` - 获取产品列表
- `GET /api/admin/products/:id` - 获取产品详情
- `PUT /api/admin/products/:id` - 更新产品信息
- `DELETE /api/admin/products/:id` - 删除产品

#### 订单管理
- `GET /api/admin/orders` - 获取所有订单
- `PUT /api/admin/orders/:id/approve` - 审核通过
- `PUT /api/admin/orders/:id/reject` - 审核拒绝

#### 统计
- `GET /api/admin/stats/overview` - 平台运营概览
- `GET /api/admin/stats/products` - 产品销售统计
- `GET /api/admin/stats/customers` - 客户统计

#### 客户管理
- `GET /api/admin/customers` - 获取所有客户
- `PUT /api/admin/customers/:id/status` - 更新客户状态

### 客户后台 API

#### 客户认证
- `POST /api/customers/register` - 客户注册
- `POST /api/customers/login` - 客户登录
- `GET /api/customers/profile` - 获取客户信息

#### 订单
- `POST /api/orders` - 创建订单（客户下单）
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情

#### API密钥
- `GET /api/customers/api-keys` - 获取API密钥（审核通过后）
- `POST /api/customers/api-keys` - 重新生成API密钥

#### 统计
- `GET /api/customers/stats/usage` - 客户用量查询
- `GET /api/customers/stats/bills` - 客户账单查询

### API网关
- `POST /api/v1/:productCode` - 调用API接口

## 数据模型

### 供应商 (Supplier)
- 名称、类型、联系方式
- API地址、认证方式
- 状态（启用/禁用）

### 产品 (Product)
- 名称、编码、描述
- 关联供应商
- 计费类型（按次/包月）
- 计费单价
- 调用限制

### 客户 (Customer)
- 企业名称、联系人、联系方式
- 营业执照
- 密码（加密存储）
- API密钥（AppId + AppSecret）- 审核通过后生成
- 状态（启用/禁用）

### 订单 (Order)
- 订单号、客户、产品
- 订单类型（按量/包月）
- 金额、有效期
- 审核状态（待审核/审核通过/审核拒绝）
- 支付状态（待支付/已支付/已过期/已取消）

### 调用记录 (ApiLog)
- 客户、产品、供应商
- 请求参数、响应
- 调用时间、耗时
- 费用

## 非功能性需求
- API响应时间 < 500ms
- 系统可用性 > 99.9%
- 支持水平扩展
- 详细的日志记录