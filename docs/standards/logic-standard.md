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
