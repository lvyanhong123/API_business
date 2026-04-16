# 客户管理模块业务文档

## 一、核心概念

### 1.1 客户/企业 (customers)
- 代表一个**企业客户**
- **重要**：一个企业下有多个部门，每个部门有多名员工
- 每个企业客户对应**一个账户**

### 1.2 账号（员工）
- 企业下的**员工注册的账号**
- 每个员工是独立的账号
- 通过 `customerId` 关联到企业客户
- **注意**：账号不等同于客户，账号是员工，账户是企业

### 1.3 账户 (customerAccounts)
- **企业层面**的财务账户
- 一个企业客户对应**一个账户**（用于计费、结算）
- 包含余额、信用额度、支付类型
- **账户与企业的关系**：一对一

### 1.4 产品 (products)
- 平台销售给客户的**API服务**
- 由平台进行定价和销售
- 一个产品可配置**多个通道**（主通道+备用通道）

### 1.5 通道 (channels)
- 供应商提供的**API接口**
- 通道是供应商的资源，平台采购后用于交付产品
- 一个通道可被多个产品使用（多对多）

### 1.6 产品与通道的关系
- **多对多关系**：一个产品可以配置多个通道，一个通道可属于多个产品
- 通道配置优先级：主通道（isPrimary=true）优先，失败后自动切换备用通道

## 二、支付类型

### 2.1 预付费 (prepay)
- 下订单时**直接划扣**账户余额/信用额度
- 充值 → 账户余额增加 → 下单时直接扣费

### 2.2 后付费 (postpay)
- 下订单时**不付款**
- 后续根据调用情况和计费规则，从账户余额/信用额度中划扣
- 通常按月结算

### 2.3 预付费与后付费的区别
| 对比项 | 预付费 | 后付费 |
|--------|--------|--------|
| 下单时 | 直接扣费 | 不付款 |
| 结算方式 | 无需后续结算 | 按调用量从账户扣费 |
| 充值 | 需要先充值 | 可后付费 |

## 三、核心业务流程

### 3.1 业务闭环流程
```
客户下单 ──→ 审核通过 ──→ 获得API Key ──→ 调用API
                                          ↓
                                    自动路由通道
                                    ↓        ↓
                               主通道    备用通道
                                    ↓        ↓
                               失败/超时自动切换
                                          ↓
                                    调用明细记录
                                          ↓
              客户账单(自动) ←────────────────┘    供应商账单(自动)
                    ↓                                    ↓
              客户付款                                付款给供应商
```

### 3.2 订单与扣费
```
购买产品(预付费) → 直接划扣账户余额
购买产品(后付费) → 下单时不付款 → 后续从账户扣费
```

### 3.3 充值流程
```
管理员操作充值 → 生成充值记录(paymentOrders) → 增加账户余额
```

### 3.4 退款流程
```
管理员操作退款 → 生成退款记录(refundOrders) → 扣除账户余额
```

### 3.5 API调用流程
```
客户调用API ──→ 验证API Key ──→ 检查账户状态 ──→ 选择通道
                                                       ↓
                                              主通道可用？──否──→ 备用通道
                                                       ↓
                                                  调用通道API
                                                       ↓
                                              成功？──否──→ 继续切换
                                                       ↓
                                                   记录调用明细
                                                       ↓
                                              扣除账户余额(预付费)
```

## 四、核心数据表

| 数据表 | 作用 | 关联关系 |
|--------|------|----------|
| customers | 企业客户基本信息（公司、联系人、营业执照） | 主表 |
| customerAccounts | 企业账户（余额、信用额度、支付类型） | customerId → customers |
| orders | 客户购买API的订单 | customerId → customers |
| apiKeys | 客户调用API的密钥 | customerId → customers, productId → products |
| products | 产品信息（名称、定价、状态） | 主表 |
| productChannels | 产品-通道关联表 | productId → products, channelId → channels |
| channels | 通道信息（供应商、URL、状态） | supplierId → suppliers |
| responseCodeMappings | 响应码映射表 | channelId → channels |
| apiLogs | 客户API调用明细（用于生成客户账单） | customerId, productId, channelId |
| customerBills | 客户月度账单 | customerId → customers |
| customerBillItems | 客户账单明细 | billId → customerBills |
| paymentOrders | 充值记录 | customerId → customers |
| refundOrders | 退款记录 | customerId → customers |

## 五、菜单结构

### 客户管理（客户管理菜单组）
- 客户列表 - 查看所有企业客户及账户信息
- 客户账单 - 查看/生成客户月度账单
- 支付记录 - 查看充值记录
- 退款记录 - 查看退款记录

### 运营管理（运营管理菜单组）
- 供应商列表 - 供应商管理
- 通道列表 - 通道管理
- 产品管理 - 产品配置通道
- 订单审核 - 客户订单审核
- 调用明细 - API调用记录
- 供应商账单 - 供应商结算账单
- 客户账单 - 客户结算账单

## 六、已确认的业务需求

### 6.1 产品与通道配置
- ✅ 一个产品可以配置多个通道（主通道+备用通道）
- ✅ 主通道优先使用，失败时自动切换到备用通道

### 6.2 通道切换规则
- ✅ 根据**响应码**判断是否需要切换（如 responseCode !== '00'）
- ✅ 根据**响应时间**判断是否需要切换（超过阈值认为失败）
- ✅ 切换条件：响应码表示失败 **或** 响应时间超过阈值

### 6.3 成本计算
- ✅ 无论使用哪个通道，都按**产品定价**计算客户费用
- ✅ 通道成本与客户无关，平台赚取差价

### 6.4 账单生成
- ✅ **客户账单**：系统自动按月生成
- ✅ **供应商账单**：系统自动按月生成

### 6.5 客户自助下单
- ✅ 客户可以通过客户门户自助下单
- ✅ 下单后需要管理员审核通过才能获得API Key

### 6.6 响应码映射
- ✅ 不同供应商的通道响应码可能不同
- ✅ 需要配置**响应码映射表**，将不同通道的响应码统一转换为系统标准码

### 6.7 充值与退款
- ✅ 充值：线下收款后，财务人员在系统录入**到款单**进行充值
- ✅ 退款：线下退款后，财务人员在系统录入**退款单**进行退款

### 6.8 客户分级
- ❌ **不需要**：所有客户一视同仁，无客户分级

### 6.9 通道限流
- ❌ **不需要**：暂不限流

### 6.10 供应商自助查询
- ❌ **不需要**：供应商不需要登录系统

### 6.11 通知机制
- ❌ **不需要**：暂不需要通知功能

### 6.12 分销/代理功能
- ⏳ **后续讨论**：分销是一块相对独立的业务，暂不纳入主线

## 七、通道管理模块（重要）

### 7.1 设计背景

**业务与技术的职责分离**：
- **业务层（页面管理）**：记录供应商有哪些通道、通道的出入参是什么，供业务人员使用
- **技术层（脚本处理）**：认证方式、认证配置等技术细节由脚本代码处理

每个供应商对应一个脚本文件，该脚本维护该供应商下所有通道的认证方式和配置。这种设计的好处是：
- 页面管理员不需要关心技术细节
- 避免在页面上遍历所有认证方式
- 技术变更（如更换密钥）直接在脚本中修改，无需改动页面

### 7.2 通道字段设计

#### 7.2.1 基础信息
| 字段 | 说明 |
|------|------|
| name | 通道名称 |
| supplierId | 关联供应商 |
| apiUrl | 接口地址 |
| status | 状态（启用/禁用） |
| dailyLimit | 日调用量限制（供应商给的总量） |
| remark | 备注 |

#### 7.2.2 入参字段列表（requestParams）
| 字段 | 说明 |
|------|------|
| name | 参数名称 |
| type | 数据类型（string/number/boolean） |
| required | 是否必填（true/false） |
| description | 参数说明 |

#### 7.2.3 出参字段列表（responseParams）
| 字段 | 说明 |
|------|------|
| name | 参数名称 |
| type | 数据类型（string/number/boolean） |
| required | 是否必填（true/false） |
| description | 参数说明 |

#### 7.2.4 出参映射（responseCodes）
由于不同供应商的响应码不同，需要统一映射给客户。

| 字段 | 说明 |
|------|------|
| supplierCode | 供应商返回的原始code值 |
| supplierMessage | 供应商返回的原始message值 |

### 7.3 不在页面显示的字段

以下字段由脚本处理，不在通道管理页面显示：
- **认证方式（authType）**：如 API Key、Bearer Token 等，由脚本统一处理
- **认证配置（authConfig）**：密钥、Token 等敏感信息，由脚本管理
- **参数规则**：校验规则（如长度限制、格式验证），由脚本处理
- **编码类型**：明文、MD5、Base64 等，由脚本处理

### 7.4 数据结构示例

```json
{
  "id": 1,
  "name": "阿里云-实名认证",
  "supplierId": 1,
  "apiUrl": "https://api.aliyun.com/realname/verify",
  "status": "active",
  "dailyLimit": 10000,
  "remark": "用于客户实名认证",
  "requestParams": [
    { "name": "name", "type": "string", "required": true, "description": "姓名" },
    { "name": "idCard", "type": "string", "required": true, "description": "身份证号" }
  ],
  "responseParams": [
    { "name": "code", "type": "string", "required": true, "description": "状态码" },
    { "name": "message", "type": "string", "required": true, "description": "状态信息" },
    { "name": "result", "type": "boolean", "required": true, "description": "认证结果" }
  ],
  "responseCodes": [
    { "supplierCode": "0", "supplierMessage": "认证通过" },
    { "supplierCode": "1001", "supplierMessage": "身份证信息有误" }
  ]
}
```

### 7.5 通道的业务价值

1. **流量控制**：记录供应商给的日调用量限制，业务人员可据此判断是否需要切换通道
2. **字段映射**：记录入参/出参字段，便于后续配置客户可见的字段
3. **统一响应**：通过出参映射，将不同供应商的响应码统一，避免客户收到混乱的code值

## 八、API网关自动路由

### 8.1 路由逻辑
1. 验证API Key有效性
2. 检查客户账户状态（是否欠费/冻结）
3. 检查产品是否在有效期
4. 按优先级选择通道（主通道优先）
5. 调用通道API
6. 失败时自动切换到下一个可用通道

### 8.2 响应码映射
- 每个通道有自己的响应码规则
- 通过 responseCodeMappings 表统一转换为系统标准码
- 系统标准码：'00' 表示成功，其他表示失败

## 九、供应商账单结算系统

### 9.1 设计原则
- **调用明细实时记录**：每次通道API调用时，立即写入 `call_logs` 表
- **账单按周期生成**：根据供应商配置的结算周期（月结/年结/自定义）生成账单
- **系统只负责生成**：账单生成后，后续确认和付款在线下进行

### 9.2 数据模型

#### 9.2.1 调用明细表 (call_logs)
```json
{
  "id": 1,
  "channelId": 1,
  "supplierId": 1,
  "customerId": 1,
  "productId": 1,
  "callTime": "2026-04-15T10:30:00Z",
  "requestParams": {},
  "responseParams": {},
  "responseCode": "00",
  "responseTime": 125,
  "cost": 0.50,
  "success": true,
  "createdAt": "2026-04-15T10:30:00Z"
}
```

#### 9.2.2 账单表 (supplier_bills)
```json
{
  "id": 1,
  "supplierId": 1,
  "billNo": "BILL202604001",
  "periodStart": "2026-04-01",
  "periodEnd": "2026-04-30",
  "settlementType": "monthly",
  "totalAmount": 12580.50,
  "status": "generated",
  "generatedAt": "2026-05-01T00:00:00Z"
}
```

#### 9.2.3 账单明细表 (bill_items)
```json
{
  "id": 1,
  "billId": 1,
  "channelId": 1,
  "callCount": 15000,
  "successCount": 14500,
  "failedCount": 500,
  "costRule": { "rule_type": "per_call", "rule_config": { "price": 0.5 } },
  "amount": 7500.00
}
```

### 9.3 供应商结算配置
在供应商表中增加结算设置字段：
- `settlementType`: 结算周期类型（monthly/yearly/custom）
- `billingDayMonthly`: 月结日（1-28日）
- `billingMonthYearly`: 年结月（1-12月）
- `billingDayYearly`: 年结日（1-28日）
- `settlementInterval`: 自定义结算间隔（月）
- `billingStartDay`: 自定义结算开始日
- `settlementMethod`: 结算方式（bank/alipay/wechat）
- `bankAccount`: 银行账户
- `bankName`: 开户行

### 9.4 成本计算规则

#### 9.4.1 按次计费 (per_call)
```json
{
  "rule_type": "per_call",
  "rule_config": { "price": 0.50 }
}
```

#### 9.4.2 按关键字计费 (per_key)
```json
{
  "rule_type": "per_key",
  "rule_config": {
    "key": "138",
    "per_time": 0.30,
    "daily_cap": 100,
    "monthly_cap": 2000
  }
}
```

#### 9.4.3 阶梯计费 (tiered)
```json
{
  "rule_type": "tiered",
  "rule_config": {
    "tiers": [
      { "range": "1-1000", "price": 0.50 },
      { "range": "1001-2000", "price": 0.30 },
      { "range": "2001-5000", "price": 0.20 }
    ]
  }
}
```

### 9.5 业务流程

```
API调用 ──→ 实时写入call_logs ──→ 计算成本
                                       ↓
                              账单生成日触发
                                       ↓
                              汇总周期内call_logs
                                       ↓
                              按通道分组计算金额
                                       ↓
                              生成supplier_bills + bill_items
                                       ↓
                              导出账单 ──→ 线下确认 ──→ 财务付款
```

### 9.6 菜单结构

#### 供应商管理（供应商管理菜单组）
- 供应商列表 - 查看/编辑供应商，含结算配置
- 通道列表 - 通道管理，含成本规则配置
- 脚本列表 - 供应商脚本管理
- **调用明细** - 通道API调用记录查询
- **供应商账单** - 供应商账单查询/生成

## 十、待确认/待完善功能

- [x] callLogs 已实现，可用于生成供应商账单
- [x] 供应商结算配置已添加（编辑供应商弹窗中）
- [x] 成本计算服务已实现（支持 per_call/per_key/tiered）
- [x] 调用明细页面已实现
- [x] 供应商账单页面已实现
- [x] 账单生成功能已实现
- [x] 通道管理模块重构（业务与技术职责分离）
- [ ] 管理员如何创建企业客户和账户（目前只有客户自助注册）
- [ ] 分销模块（后续单独讨论）
- [ ] 客户账单功能（目前只实现了供应商账单）
- [ ] 计费方式（按调用次数/包天包月）（后续单独讨论）
- [ ] 智能路由模块（通道自动切换）（后续单独讨论）
