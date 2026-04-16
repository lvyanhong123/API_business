# 前端组件规范 (Component Standard)

## 概述

本文档定义**前端组件的选择和组合规范**。违反这些规范会影响功能实现或用户体验一致性。

---

## 列表页面组件规范

### 页面组件组成

所有列表页面必须包含以下**两个组件区域**：

| 组件区域 | 说明 | 必须包含 |
|----------|------|----------|
| **搜索区域组件** | 用于条件筛选 | 搜索控件 + 搜索/重置按钮 |
| **列表区域组件** | 用于数据展示 | 表格 + 分页器 |

### 搜索区域组件结构

```html
<div class="card">
  <div class="card-header">
    <div class="card-title">搜索项</div>
  </div>
  <div class="search-bar">
    <!-- 搜索控件：输入框、选择框、日期等 -->
    <!-- 搜索和重置按钮 -->
  </div>
</div>
```

### 列表区域组件结构

```html
<div class="card">
  <div class="card-header">
    <div class="card-title">列表标题</div>
    <!-- 操作按钮（新增等）放右侧 -->
  </div>
  <div class="search-results" id="xxxSearchResults">共 0 条</div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>列1</th><th>列2</th></tr></thead>
      <tbody id="xxxTableBody"></tbody>
    </table>
  </div>
  <div id="xxxPagination" class="pagination"></div>
</div>
```

---

## 分页组件规范

### 分页变量

每个列表页面必须定义以下变量：

```javascript
let xxxAllData = [];      // 完整数据
let xxxCurrentPage = 1;   // 当前页
let xxxPageSize = 20;     // 每页条数
```

### 分页器必须包含

| 元素 | 说明 |
|------|------|
| 上一页/下一页按钮 | 禁用状态需处理 |
| 页码数字按钮 | 超过7页显示省略号 |
| 每页条数选择器 | 选项：10/20/50 |

### 分页器渲染函数模板

```javascript
function renderXxxPagination(total, current, size) {
  const totalPages = Math.ceil(total / size) || 1;
  let html = `<button ${current <= 1 ? 'disabled' : ''} onclick="goToXxxPage(${current - 1})">上一页</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i !== 1 && i !== totalPages && Math.abs(i - current) > 1) {
      if (i === 2 || i === totalPages - 1) {
        html += `<span style="padding:0 5px;">...</span>`;
      }
      continue;
    }
    html += `<button class="${i === current ? 'active' : ''}" onclick="goToXxxPage(${i})">${i}</button>`;
  }

  html += `<button ${current >= totalPages ? 'disabled' : ''} onclick="goToXxxPage(${current + 1})">下一页</button>`;
  html += `<span style="margin-left:10px;font-size:14px;color:#666;">每页</span>`;
  html += `<select style="padding:4px 8px;border:1px solid #ddd;border-radius:4px;margin:0 5px;" onchange="changeXxxPageSize(this.value)">`;
  html += `<option value="10" ${size == 10 ? 'selected' : ''}>10</option>`;
  html += `<option value="20" ${size == 20 ? 'selected' : ''}>20</option>`;
  html += `<option value="50" ${size == 50 ? 'selected' : ''}>50</option>`;
  html += `</select>`;
  html += `<span style="font-size:14px;color:#666;">条</span>`;
  return html;
}
```

---

## Tab标签页组件规范

### openTab 函数处理

在 `openTab` 函数中新增 tab 类型时，必须同时处理：

```javascript
} else if (tabId === 'xxx-list') {
  tabs.push({ id: tabId, name: '列表名称' });
  activeMenuGroup = 'menuGroupName'; // 或 ''
}
```

### switchTab 函数处理

```javascript
else if (tabId === 'xxx-list') loadXxx();
```

### 数据概览Tab固定要求

- 固定在左侧菜单**第一位**
- 登录后**默认展示**的页面
- 在标签栏中固定在**第一个位置**
- **不可关闭**（不显示 × 按钮）

---

## 菜单组件规范

### 一级菜单 + 二级菜单结构

```
▼ 供应商管理
  ├── 供应商列表
  └── 通道列表（全局）
- 产品管理
- 订单审核
- 客户管理
- 数据概览
```

### 供应商管理菜单交互

- 供应商管理为一级菜单，点击可展开/收起二级菜单
- 一级菜单选中时无背景高亮，只显示箭头旋转
- 二级菜单选中时有蓝色背景高亮
- 顶部标题栏已移除，只保留右上角头像

### 多菜单组支持

如存在多个展开菜单组（如供应商管理、客户管理），需在 `toggleMenuGroup` 和 `renderMenu` 函数中正确处理所有菜单组的展开/收起状态。

---

## 页面加载函数模板

```javascript
async function loadXxx() {
  const data = await fetchAPI('/api/xxx');
  if (!data) return;

  xxxAllData = data.xxx || [];
  xxxCurrentPage = 1;

  $('#tabContent').innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">搜索项</div>
      </div>
      <div class="search-bar">
        <button onclick="filterXxx()">搜索</button>
        <button onclick="resetXxxFilter()">重置</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">列表标题</div>
        <button onclick="showAddModal()">新增</button>
      </div>
      <div class="search-results" id="xxxSearchResults">共 0 条</div>
      <div class="table-wrap">
        <table>
          <thead>...</thead>
          <tbody id="xxxTableBody"></tbody>
        </table>
      </div>
      <div id="xxxPagination" class="pagination"></div>
    </div>
  `;

  filterXxx();
}
```

---

## Filter函数分页逻辑模板

```javascript
function filterXxx() {
  const keyword = $('#xxxSearchInput').value;
  const status = $('#xxxStatusSelect').value;

  const filtered = allData.filter(item => {
    return matchCondition;
  });

  const total = filtered.length;
  const start = (xxxCurrentPage - 1) * xxxPageSize;
  const paginatedData = filtered.slice(start, start + xxxPageSize);

  $('#xxxTableBody').innerHTML = renderXxxTable(paginatedData);
  $('#xxxSearchResults').innerHTML = `<span>共 ${total} 条</span>`;
  $('#xxxPagination').innerHTML = renderXxxPagination(total, xxxCurrentPage, xxxPageSize);
}
```

---

## 分页控制函数模板

```javascript
function goToXxxPage(page) {
  xxxCurrentPage = page;
  filterXxx();
}

function changeXxxPageSize(size) {
  xxxPageSize = parseInt(size);
  xxxCurrentPage = 1;
  filterXxx();
}

function resetXxxFilter() {
  xxxCurrentPage = 1;
  $('#xxxSearchInput').value = '';
  $('#xxxStatusSelect').value = '';
  filterXxx();
}
```

---

## 强制执行的组件规范

以下规范**禁止违反**，违反将导致功能缺失或用户体验不一致：

### 列表页面强制要求
- **禁止省略**任何列表页面的分页功能
- **禁止使用**非统一的页面结构
- **禁止省略** search-results 和 pagination 容器

### Tab标签页强制要求
新页面必须在 `openTab` 函数中注册，必须包含：
1. tabs 数组添加
2. activeMenuGroup 设置
3. switchTab 函数处理

### API路由强制要求
- 前端调用的 API 路径必须与后端实际注册的路由**完全一致**
- 添加新功能时，确保后端路由已正确注册
