# API Business 项目规范

## 列表页面规范（强制执行）

所有列表页面必须遵循以下统一结构：

### 页面结构
```html
<!-- 搜索区域 -->
<div class="card">
  <div class="card-header">
    <div class="card-title">搜索项</div>
  </div>
  <div class="search-bar">
    <!-- 搜索控件和搜索/重置按钮 -->
  </div>
</div>

<!-- 列表区域 -->
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

### 分页变量
```javascript
let xxxAllData = [];
let xxxCurrentPage = 1;
let xxxPageSize = 20;
```

### 分页器必须包含
- 上一页/下一页按钮
- 页码数字按钮（超过7页显示省略号）
- 每页条数选择器（10/20/50）

### Tab支持
新页面必须在`openTab`函数中注册，必须包含：
1. tabs数组添加
2. activeMenuGroup设置
3. switchTab函数处理

## 禁止事项
- 禁止省略任何列表页面的分页功能
- 禁止使用非统一的页面结构
- 禁止省略search-results和pagination容器
