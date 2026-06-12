# 地方公交站牌设计图鉴

收录各地公交站牌样式的小型全栈 MVP，支持浏览、详情查看与基础 CRUD。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + TypeScript + PrimeVue + Tailwind CSS |
| 后端 | Express + TypeScript + better-sqlite3 |
| 状态/路由 | Pinia + Vue Router |
| 数据 | SQLite（`backend/data/signs.db`） |

## 项目结构

```
├── backend/          # Express API（端口 4000）
│   ├── src/
│   │   ├── index.ts      # 入口
│   │   ├── db.ts         # 数据库初始化
│   │   ├── seed.ts       # 5 条 seed 数据
│   │   └── routes/signs.ts
│   └── data/signs.db     # 运行时自动创建
└── frontend/         # Vue 前端（端口 4101）
    └── src/
        ├── views/        # 图鉴列表 + 详情页
        ├── components/   # 表单 Dialog
        ├── stores/       # Pinia
        └── api/          # axios 封装
```

## 快速启动

### 1. 启动后端

```bash
cd backend
npm install
npm run dev
```

后端运行于 **http://localhost:4000**，首次启动自动创建数据库并插入 5 条 seed 数据。

### 2. 启动前端

另开终端：

```bash
cd frontend
npm install
npm run dev
```

前端运行于 **http://localhost:4101**，API 请求通过 Vite 代理转发至后端。

### 常见问题（Windows）

`better-sqlite3` 为原生模块，安装时会自动下载预编译包。若 `npm install` 失败：

1. 确保网络可访问 GitHub Releases
2. 或安装 [Python 3](https://www.python.org/) 与 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) 后重新执行 `npm install`

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/signs` | 获取全部站牌 |
| GET | `/api/signs/:id` | 获取单条站牌 |
| POST | `/api/signs` | 新建站牌 |
| PUT | `/api/signs/:id` | 更新站牌 |
| DELETE | `/api/signs/:id` | 删除站牌 |

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `city` | string | 城市 |
| `styleDescription` | string | 样式描述 |
| `era` | string | 年代 |
| `inUse` | boolean | 是否使用中 |
| `imageUrl` | string | 图片 URL |

## 页面功能

- **图鉴列表**（`/`）：PrimeVue DataView 网格/列表切换，快速预览 Dialog，新增站牌
- **详情页**（`/signs/:id`）：完整信息展示，编辑与删除
