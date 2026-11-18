# AI CRM

一个参考 Salesforce Sales Cloud 风格的轻量级 CRM 系统，采用前后端分离架构，生产模式可由 API 同源提供前端页面。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 后端 | NestJS 12 + TypeORM 0.3 + SQLite（better-sqlite3） |
| 前端 | React 19 + TypeScript + Vite 8 + Material UI 7 + Emotion |
| 图表 | Recharts |
| 拖拽 | dnd-kit |
| 数据请求 | TanStack Query |

## 目录结构

```
apps/
├── api/    # NestJS API，默认 http://localhost:3000/api
└── web/    # React 前端，开发模式默认 http://localhost:5173
data/       # SQLite 数据库文件（首次启动自动创建并写入演示数据）
```

## 本地运行

```bash
npm install
npm run dev
```

- 前端：http://localhost:5173
- 接口：http://localhost:3000/api

也可以分别启动：

```bash
npm run dev:api
npm run dev:web
```

## 生产模式

生产模式会自动构建前后端，并由 API 同源提供前端页面：

```bash
npm run start
```

然后访问 http://localhost:3000 。也可以先执行 `npm run build`，再运行：

```bash
npm run start:prod -w @ai-crm/api
```

## 功能模块

- **首页**：关键指标、销售漏斗、活动分布、最近商机、近期待办
- **潜在客户**：列表、搜索、状态筛选、新建/编辑/删除、详情、备注、一键转换为客户/联系人/商机
- **客户（Accounts）**：列表、搜索、详情、关联联系人与商机、备注
- **联系人（Contacts）**：列表、搜索、新建/编辑/删除、详情、关联客户
- **商机（Opportunities）**：看板视图（拖拽改变阶段）/列表视图、新建/编辑/删除、详情、关联活动
- **活动（Activities）**：待办/已完成/全部视图，按日期分组，一键完成、新建、编辑、删除
- **报表（Reports）**：销售漏斗、赢单趋势、负责人业绩、重点客户、线索状态、活动分布，支持时间范围筛选
- **全局搜索**：跨客户、联系人、潜在客户与商机的即时搜索
- **应用外壳**：Salesforce Lightning 风格深色全局头部、对象导航、左侧导航/最近浏览、快速新建与待办提醒

首次启动时，后端会自动创建 `data/crm.sqlite` 并填充销售流程、客户、联系人、潜在客户、商机、活动与备注等演示数据。删除该文件后重启即可重置。

## 常用检查

```bash
npm run typecheck
npm run build
```
