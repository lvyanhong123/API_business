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

## 前端UI规范（强制执行）

### 菜单规范
1. **箭头图标**：只允许使用简约的 `>` 字符，禁止使用 `▶` 等花哨符号
2. **子菜单高度**：设置 `max-height` 限制，并添加 `overflow-y: auto` 实现滚动
3. **滚动条样式**：需要与背景融合，使用半透明白色，如 `#ffffff30`
4. **多菜单组支持**：如存在多个展开菜单组（如供应商管理、客户管理），需在 `toggleMenuGroup` 和 `renderMenu` 函数中正确处理所有菜单组的展开/收起状态

### 菜单组函数要求
当存在多个菜单组时，`toggleMenuGroup` 和 `renderMenu` 函数必须：
1. 通过 `id` 或 `textContent` 正确区分不同菜单组
2. 分别为每个菜单组的子菜单设置 `open` 类
3. 分别为每个菜单组标题设置 `active` 类

### API路由规范
- 前端调用的 API 路径必须与后端实际注册的路由完全一致
- 添加新功能时，确保后端路由已正确注册
