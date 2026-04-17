# 代码实现逻辑规范 (Logic Standard)

## 概述

本文档定义**代码实现逻辑规范**，包括命名规范、API规范、后端逻辑等。

---

## 命名规范

### 变量命名

- 使用**驼峰式**命名
- 例如：`currentPage`, `pageSize`, `searchKeyword`

### 函数命名

- 使用**驼峰式**命名
- 例如：`loadXxx`, `filterXxx`, `renderXxxPagination`, `goToXxxPage`

### DOM元素ID命名

| 元素 | ID格式 | 示例 |
|------|--------|------|
| 表格body | xxxTableBody | supplierTableBody |
| 分页器 | xxxPagination | supplierPagination |
| 搜索结果 | xxxSearchResults | supplierSearchResults |
| 搜索输入框 | xxxSearchInput | supplierSearchInput |
| 状态选择框 | xxxStatusSelect | supplierStatusSelect |

### 数据变量命名

| 变量 | 命名格式 | 说明 |
|------|----------|------|
| 完整数据 | xxxAllData | 列表页面用于筛选的完整数据 |
| 当前页 | xxxCurrentPage | 分页当前页码 |
| 每页条数 | xxxPageSize | 分页每页显示条数 |

---

## 菜单栏设计规范

### 核心原则

菜单栏的状态管理应该**集中统一**，避免在多个地方重复编写相似的判断逻辑。

### 标准结构

```javascript
// 1. 菜单组定义（唯一数据源）
const MENU_GROUPS = {
  'suppliers': '供应商管理',
  'customers': '客户管理',
  'bill-management': '账单管理'
};

// 2. 菜单元素与组的映射
const MENU_SUB_IDS = {
  'menuSuppliersSub': 'suppliers',
  'menuCustomersSub': 'customers',
  'menuBillManagementSub': 'bill-management'
};
```

### 添加新菜单组的标准流程

| 步骤 | 操作 |
|------|------|
| 1 | 在 `MENU_GROUPS` 中添加新组 |
| 2 | 在 HTML 中添加菜单 DOM 结构 |
| 3 | 在 `openTab` 的 `activeMenuGroup` 判断链中添加 |
| 4 | 在 `updateMenuDisplay` 中添加 DOM 更新逻辑 |
| 5 | 在 `toggleMenuGroup` 中添加菜单切换逻辑 |
| 6 | 在 `renderMenu` 中添加菜单组识别逻辑 |

### 错误示例

在多个地方硬编码判断逻辑：

```javascript
// ❌ 错误：每次添加菜单组都要改4个地方，容易遗漏
if (title.includes('供应商')) groupName = 'suppliers';
else if (title.includes('客户')) groupName = 'customers';
else if (title.includes('账单')) groupName = 'bill-management'; // 新增时漏改

// ❌ renderMenu 中的错误映射
const groupName = subId === 'menuSuppliersSub' ? 'suppliers' : 'customers';
// 当 subId 是 menuBillManagementSub 时，被错误归类为 'customers'
```

### 正确示例

使用统一映射，避免重复判断：

```javascript
// ✅ 正确：使用映射表，所有函数共用
const MENU_SUB_IDS = {
  'menuSuppliersSub': 'suppliers',
  'menuCustomersSub': 'customers',
  'menuBillManagementSub': 'bill-management'
};

function getGroupNameFromId(id) {
  return MENU_SUB_IDS[id] || '';
}

// 所有函数调用同一个映射
function updateMenuDisplay() {
  for (const [subId, groupName] of Object.entries(MENU_SUB_IDS)) {
    const subEl = document.getElementById(subId);
    if (subEl) subEl.className = 'menu-sub ' + (activeMenuGroup === groupName ? 'open' : '');
  }
}
```

### 检查清单

添加/修改菜单组时：
- [ ] 更新 MENU_GROUPS 定义
- [ ] 更新 MENU_SUB_IDS 映射
- [ ] openTab 函数
- [ ] updateMenuDisplay 函数
- [ ] toggleMenuGroup 函数
- [ ] renderMenu 函数

---

## API响应规范

### 统一响应格式

所有API响应使用统一的JSON格式：

**成功响应：**
```json
{
  "success": true,
  "data": { ... }
}
```

**失败响应：**
```json
{
  "success": false,
  "error": "错误信息"
}
```

### API路由规范

- 前端调用的 API 路径必须与后端实际注册的路由**完全一致**
- 添加新功能时，确保后端路由已正确注册

---

## 表单验证规范

### 前端验证

- 所有**必填字段**必须在前端进行验证
- 验证失败时显示**明确的错误提示**
- 保存操作前进行数据完整性检查

### 后端验证

- 所有**必填字段**必须在后端进行验证
- 后端验证是**最后一道防线**，不能省略

---

## 列表页面逻辑规范

### 数据获取与缓存

```javascript
async function loadXxx() {
  const data = await fetchAPI('/api/xxx');
  if (!data) return;

  xxxAllData = data.xxx || [];
  xxxCurrentPage = 1;
  filterXxx();
}
```

### 筛选逻辑

```javascript
function filterXxx() {
  const keyword = $('#xxxSearchInput').value;
  const status = $('#xxxStatusSelect').value;

  const filtered = xxxAllData.filter(item => {
    let match = true;
    if (keyword && !item.name.includes(keyword)) {
      match = false;
    }
    if (status && item.status !== status) {
      match = false;
    }
    return match;
  });

  const total = filtered.length;
  const start = (xxxCurrentPage - 1) * xxxPageSize;
  const paginatedData = filtered.slice(start, start + xxxPageSize);

  $('#xxxTableBody').innerHTML = renderXxxTable(paginatedData);
  $('#xxxSearchResults').innerHTML = `<span>共 ${total} 条</span>`;
  $('#xxxPagination').innerHTML = renderXxxPagination(total, xxxCurrentPage, xxxPageSize);
}
```

### 重置逻辑

```javascript
function resetXxxFilter() {
  xxxCurrentPage = 1;
  $('#xxxSearchInput').value = '';
  $('#xxxStatusSelect').value = '';
  filterXxx();
}
```

---

## 弹窗操作规范

### 打开弹窗

- 点击操作按钮时，先获取当前行数据
- 调用弹窗渲染函数，传入数据
- 显示弹窗遮罩层

### 保存数据

- 保存前进行表单验证
- 调用API保存数据
- 保存成功后关闭弹窗、刷新列表

### 取消操作

- 点击取消按钮或遮罩层关闭弹窗
- 不进行任何数据保存

---

## 错误处理规范

### 前端错误处理

```javascript
async function loadXxx() {
  try {
    const data = await fetchAPI('/api/xxx');
    if (!data) return;
    xxxAllData = data.xxx || [];
    filterXxx();
  } catch (error) {
    console.error('加载数据失败:', error);
    alert('加载数据失败，请稍后重试');
  }
}
```

### API请求错误处理

```javascript
async function fetchAPI(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || '请求失败');
    }
    return result.data;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}
```

---

## 数据状态管理规范

### Tab状态保存

- 切换Tab时调用 `saveTabState()` 保存当前状态到 localStorage
- 包括 `activeTabId` 等关键状态

```javascript
function switchTab(tabId) {
  activeTabId = tabId;
  saveTabState();
  renderTabs();
  loadTabContent(tabId);
}
```

### 状态恢复

- 页面加载时从 localStorage 恢复 Tab 状态
- 确保刷新页面后停留在当前 Tab

---

## 功能完成标准

**完整功能 = 后端接口 + 前端页面 + 前后端联调通过。只做后端接口不算完成。**

- 后端接口：API路由、控制器、数据库操作
- 前端页面：表单、列表、交互逻辑
- 前后端联调：接口对接、数据流转、体验验证

---

## 多用户端考虑规范

**实现任何功能时，必须同时考虑所有涉及的用户端，避免遗漏。**

| 用户端 | 说明 |
|--------|------|
| 客户自助门户 (client.html, 端口3001) | 企业客户/员工使用 |
| 管理后台 (admin.html, 端口3000) | 平台管理员使用 |

**常见遗漏场景：**

| 功能场景 | 必须处理的用户端 |
|----------|-----------------|
| 新增账号体系 | 客户门户（注册/登录）+ 管理后台（账号管理） |
| 账号绑定企业 | 客户门户（申请绑定）+ 管理后台（审批） |
| 企业管理员变更 | 客户门户（申请变更）+ 管理后台（审批处理） |
| 禁用/启用账号 | 管理后台（操作）+ 客户门户（状态反馈） |

**实现检查清单：**
1. 功能涉及哪些用户操作？
2. 每个用户操作对应哪个用户端？
3. 每个用户端的页面和接口是否都已实现？
