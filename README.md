# Vue3 Admin Dashboard

基于 **Vue 3 + TypeScript + Pinia + Ant Design Vue** 构建的模拟后台管理系统，涵盖前端开发核心知识点。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API / `<script setup>`) |
| 语言 | TypeScript (strict mode) |
| 状态管理 | Pinia (Setup Store + Options Store) |
| 路由 | Vue Router 4 (嵌套路由 + 导航守卫) |
| UI 组件库 | Ant Design Vue 4 |
| 国际化 | vue-i18n 9 (zh-CN / en-US) |
| 代码规范 | ESLint + Prettier |
| 构建工具 | Vite 5 |
| 数据模拟 | Mock API (fetch 拦截模式) |

## 在线演示

🔗 **演示地址：** [http://124.220.37.120](http://124.220.37.120)

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 登录账号

Mock API 内置三个测试账号，密码统一为 `123456`：

| 用户名 | 角色 | 说明 |
|--------|------|------|
| admin | 管理员 | 全部权限 |
| editor | 编辑 | 普通用户 |
| guest | 访客 | 受限用户 |

## 项目结构

```
src/
├── api/                    # API 服务层（统一请求封装）
│   ├── index.ts            # request() + token 管理
│   ├── auth.ts             # 登录/登出
│   ├── dashboard.ts        # 仪表盘数据
│   ├── menu.ts             # 菜单数据
│   ├── table.ts            # 表格 CRUD
│   └── todo.ts             # Todo CRUD
├── mock/                   # Mock 模拟后端
│   ├── index.ts            # fetch 拦截入口
│   ├── data.ts             # 初始数据集
│   └── handlers.ts         # API 路由匹配 + 模拟延迟
├── router/                 # 路由配置（菜单唯一数据源）
├── stores/                 # Pinia 状态管理
│   ├── authStore.ts        # 认证状态
│   ├── todoStore.ts        # 待办数据
│   └── themeStore.ts       # 主题管理
├── layouts/                # 布局组件
│   └── AdminLayout.vue     # 后台布局（侧边栏 + Tab 标签页）
├── views/                  # 页面视图
│   ├── Login.vue           # 登录页
│   ├── Dashboard.vue       # 仪表盘
│   ├── TodoDemo.vue        # 待办事项 CRUD
│   ├── ComplexForm.vue     # 复杂表单（动态/级联/嵌套）
│   ├── DataTable.vue       # 数据表格 CRUD
│   ├── Timeline.vue        # 时间线 + 步骤表单
│   ├── Shortcuts.vue       # 键盘快捷键演示
│   ├── StoreDemo.vue       # Pinia 状态管理对比
│   └── ComposableDemo.vue  # Composable 函数演示
├── composables/            # 组合式函数
│   ├── useDebounce.ts      # 防抖
│   ├── useLocalStorage.ts  # localStorage 持久化
│   └── useShortcuts.ts     # 快捷键注册
├── locales/                # i18n 语言包
│   ├── zh-CN.json
│   └── en-US.json
├── types/                  # TypeScript 类型定义
├── styles/                 # 全局样式 + 主题变量
├── App.vue                 # 根组件（router-view 容器）
└── main.ts                 # 应用入口
```

## 数据流

```
Component → Store Action → API Service → fetch(/api/*)
                                              ↓
                                     Mock 拦截 → handlers.ts
                                     延迟 200-500ms → 返回 JSON
```

## 页面知识点覆盖

| 页面 | 知识点 |
|------|--------|
| Login | 表单校验、异步登录、路由重定向、loading 状态 |
| Dashboard | Statistic 统计卡片、Grid 响应式、Progress 进度条 |
| TodoDemo | storeToRefs、异步 action、API → Store → Component |
| ComplexForm | 动态表单、省市级联 watch、自定义异步校验、嵌套表单 |
| DataTable | Table CRUD、行选择批量操作、computed 搜索过滤 |
| Timeline | Timeline 时间线、Steps 分步表单、异步提交 |
| Shortcuts | 全局/局部快捷键 composable、键盘事件处理 |
| StoreDemo | Setup Store vs Options Store、$subscribe、storeToRefs |
| ComposableDemo | useDebounce 防抖、useLocalStorage 持久化、useShortcuts |

## 全局快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+Shift+T | 切换主题 |
| Ctrl+Shift+L | 切换语言 |
| Ctrl+Shift+K | 命令搜索 |
| Ctrl+Shift+F | 聚焦搜索框 |
| Ctrl+Shift+S | 打开设置 |
