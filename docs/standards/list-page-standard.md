# API Business 项目开发规范

## 1. 列表页面规范

### 1.1 页面结构

所有列表页面必须包含以下三个区域：

```html
<!-- 搜索区域 -->
<div class="card">
  <div class="card-header">
    <div class="card-title">搜索项</div>
  </div>
  <div class="search-bar">
    <!-- 搜索控件：输入框、选择框、日期等 -->
    <!-- 搜索和重置按钮 -->
  </div>
</div>

<!-- 列表区域 -->
<div class="card">
  <div class="card-header">
    <div class="card-title">列表标题</div>
    <!-- 操作按钮（新增等）放右侧 -->
  </div>
  <div class="search-results">共 N 条</div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>列1</th>
          <th>列2</th>
          <!-- 表头 -->
        </tr>
      </thead>
      <tbody id="xxxTableBody">
        <!-- 表格内容 -->
      </tbody>
    </table>
  </div>
  <div id="xxxPagination" class="pagination"></div>
</div>
```

### 1.2 分页规范

#### 变量定义
```javascript
let xxxAllData = [];           // 完整数据
let xxxCurrentPage = 1;        // 当前页
let xxxPageSize = 20;          // 每页条数
```

#### 分页器渲染函数
```javascript
function renderXxxPagination(total, current, size) {
  const totalPages = Math.ceil(total / size) || 1;
  let html = `<button ${current <= 1 ? 'disabled' : ''} onclick="goToXxxPage(${current - 1})">上一页</button>`;

  // 页码显示逻辑（超过7页显示省略号）
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

#### 分页控制函数
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
```

#### Filter函数分页逻辑
```javascript
function filterXxx() {
  // 1. 获取搜索条件
  const keyword = $('#xxxSearchInput').value;
  const status = $('#xxxStatusSelect').value;

  // 2. 过滤数据
  const filtered = allData.filter(item => {
    // 匹配条件
    return matchCondition;
  });

  // 3. 分页计算
  const total = filtered.length;
  const start = (xxxCurrentPage - 1) * xxxPageSize;
  const paginatedData = filtered.slice(start, start + xxxPageSize);

  // 4. 渲染
  $('#xxxTableBody').innerHTML = renderXxxTable(paginatedData);
  $('#xxxSearchResults').innerHTML = `<span>共 ${total} 条</span>`;
  $('#xxxPagination').innerHTML = renderXxxPagination(total, xxxCurrentPage, xxxPageSize);
}
```

#### 重置函数
```javascript
function resetXxxFilter() {
  xxxCurrentPage = 1;
  // 重置所有搜索控件的值
  $('#xxxSearchInput').value = '';
  $('#xxxStatusSelect').value = '';
  filterXxx();
}
```

### 1.3 页面加载函数
```javascript
async function loadXxx() {
  // 1. 获取数据
  const data = await fetchAPI('/api/xxx');
  if (!data) return;

  // 2. 保存完整数据
  xxxAllData = data.xxx || [];

  // 3. 重置分页状态
  xxxCurrentPage = 1;

  // 4. 渲染页面结构
  $('#tabContent').innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">搜索项</div>
      </div>
      <div class="search-bar">
        <!-- 搜索控件 -->
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

  // 5. 初始加载
  filterXxx();
}
```

### 1.4 Tab标签页支持

在`openTab`函数中新增tab类型时，必须同时处理：
1. 将tab添加到tabs数组
2. 设置activeMenuGroup
3. 在switchTab中处理页面加载

```javascript
// openTab函数中
} else if (tabId === 'xxx-list') {
  tabs.push({ id: tabId, name: '列表名称' });
  activeMenuGroup = 'menuGroupName'; // 或 ''
}

// switchTab函数中
else if (tabId === 'xxx-list') loadXxx();
```

## 2. 表单验证规范

- 所有必填字段必须在前端和后端双重验证
- 验证失败时显示明确的错误提示
- 保存操作前进行数据完整性检查

## 3. API响应规范

- 所有API响应使用统一的JSON格式
- 成功：`{ success: true, data: {...} }`
- 失败：`{ success: false, error: '错误信息' }`

## 4. 命名规范

- 变量命名：驼峰式，如 `currentPage`, `pageSize`
- 函数命名：驼峰式，如 `loadXxx`, `filterXxx`, `renderXxxPagination`
- DOM元素ID：xxxTableBody, xxxPagination, xxxSearchResults
