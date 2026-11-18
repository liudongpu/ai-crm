# AI CRM

一个参考 Pipedrive 风格设计的轻量级 CRM 系统，采用前后端分离架构。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 后端 | NestJS 12 + TypeORM 0.3 + SQLite (better-sqlite3) |
| 前端 | React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + shadcn/ui 风格组件 |
| 图表 | Recharts |
| 拖拽 | dnd-kit |
| 数据请求 | TanStack Query |

## 目录结构

```
apps/
├── api/    # NestJS API，默认 http://localhost:3000/api
└── web/    # React 前端，默认 http://localhost:5173
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

生产构建：

```bash
npm run build
npm start
```

## 功能

- **销售概览**：关键指标、销售漏斗、活动分布、最近交易、近期待办
- **交易管理**：看板视图（支持拖拽改变阶段）/ 列表视图、新建、编辑、删除、详情抽屉
- **联系人**：搜索、新建、编辑、删除、详情
- **公司**：卡片列表、统计关联联系人与交易金额
- **活动**：按日期分组的待办清单、一键完成、新建、编辑、删除

首次启动时，后端会自动创建 `data/crm.sqlite` 并填充销售流程、公司、联系人、交易与活动等演示数据。删除该文件后重启即可重置。
