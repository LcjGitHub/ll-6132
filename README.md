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

> **注意**：必须先启动后端，再访问前端，否则图鉴列表为空。`npm install` 会自动下载 SQLite 原生模块；若仍失败，可手动执行 `node scripts/install-better-sqlite3.js`。

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

## 工程化脚本

### 一键安装依赖

在项目根目录执行以下命令，可一次性安装根目录、后端和前端的所有依赖：

```bash
npm run install:all
```

### 本地开发

项目提供统一的启动脚本，支持以下三种启动方式：

| 命令 | 说明 |
|------|------|
| `npm run dev` | 同时启动后端（端口 4000）和前端（端口 4101）开发服务器，日志带颜色区分 |
| `npm run dev:backend` | 仅启动后端开发服务器 |
| `npm run dev:frontend` | 仅启动前端开发服务器 |

> **提示**：使用 `npm run dev` 时，两个服务的日志会在同一终端输出，蓝色为后端日志，绿色为前端日志。按下 `Ctrl + C` 可同时停止两个服务。

### 类型检查与构建

| 命令 | 说明 |
|------|------|
| `npm run typecheck` | 依次执行后端和前端的 TypeScript 类型检查 |
| `npm run typecheck:backend` | 仅检查后端 TypeScript 类型（通过 tsc 编译实现） |
| `npm run typecheck:frontend` | 仅检查前端 TypeScript 类型（通过 vue-tsc 实现） |
| `npm run build` | 依次构建后端和前端生产版本 |
| `npm run build:backend` | 仅构建后端，输出到 `backend/dist` 目录 |
| `npm run build:frontend` | 仅构建前端，输出到 `frontend/dist` 目录 |

### 数据初始化

如需重新插入 seed 数据，可执行：

```bash
npm run seed
```

## 持续集成（CI）

项目配置了 GitHub Actions 持续集成流水线，配置文件位于 `.github/workflows/ci.yml`。

### 触发时机

- **代码推送**：向任意分支推送代码时自动触发
- **合并请求**：创建或更新 Pull Request 时自动触发

### 流水线步骤

流水线在 Ubuntu 环境（Node.js 20.x）上执行以下步骤，**任一步骤失败则整个流水线标记为失败**：

1. **检出代码**：拉取最新代码
2. **安装依赖**：分别安装根目录、后端、前端的依赖（使用 `npm ci` 确保版本一致）
3. **后端编译**：执行 `tsc` 编译后端 TypeScript 代码，验证类型正确性
4. **前端类型检查**：执行 `vue-tsc -b` 对前端 Vue + TypeScript 代码进行类型检查
5. **前端构建**：执行 `vite build` 构建前端生产版本

### 查看结果

推送代码后，可在 GitHub 仓库的 **Actions** 标签页查看流水线执行状态和详细日志。

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
