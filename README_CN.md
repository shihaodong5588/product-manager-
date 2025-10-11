# 产品管理系统 Demo

这是一个基于 Next.js 15、TypeScript、Tailwind CSS、shadcn/ui 和 Prisma 构建的产品管理工具演示项目。

## 功能特性

### 1. 项目概览仪表盘
- 实时统计需求总数、任务总数
- 显示已完成任务、进行中任务
- 高优先级任务提醒

### 2. 需求管理
- 创建、查看需求
- 需求优先级管理（高、中、低）
- 需求状态跟踪（已提交、已批准、开发中、测试中、已完成、已拒绝）
- 需求标签化管理
- 需求详细描述

### 3. 任务看板（Kanban）
- 四列看板：待办、进行中、审核中、已完成
- 拖拽式任务状态更新
- 任务优先级标记
- 任务负责人分配
- 任务详细描述

## 技术栈

- **前端框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: shadcn/ui
- **数据库 ORM**: Prisma
- **数据库**: PostgreSQL
- **运行环境**: Node.js

## 快速开始

### 1. 安装依赖

\`\`\`bash
cd product-manager
npm install
\`\`\`

### 2. 配置数据库

确保已安装并运行 PostgreSQL，然后编辑 `.env` 文件：

\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/product_manager?schema=public"
\`\`\`

将 `user` 和 `password` 替换为你的 PostgreSQL 用户名和密码。

### 3. 初始化数据库

\`\`\`bash
# 创建数据库迁移
npx prisma migrate dev --name init

# 生成 Prisma Client
npx prisma generate
\`\`\`

### 4. 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

\`\`\`
product-manager/
├── app/
│   ├── api/              # API 路由
│   │   ├── requirements/ # 需求相关 API
│   │   └── tasks/        # 任务相关 API
│   ├── page.tsx          # 主页面
│   └── globals.css       # 全局样式
├── components/
│   ├── ui/               # shadcn/ui 组件
│   ├── dashboard.tsx     # 仪表盘组件
│   ├── requirements-list.tsx  # 需求列表组件
│   └── kanban-board.tsx  # 看板组件
├── lib/
│   ├── prisma.ts         # Prisma 客户端实例
│   └── utils.ts          # 工具函数
├── prisma/
│   └── schema.prisma     # 数据库模型定义
└── package.json
\`\`\`

## 数据模型

### Requirement (需求)
- 标题、描述
- 优先级（LOW, MEDIUM, HIGH）
- 状态（SUBMITTED, APPROVED, IN_DEVELOPMENT, IN_TESTING, COMPLETED, REJECTED）
- 标签数组
- 关联任务

### Task (任务)
- 标题、描述
- 状态（TODO, IN_PROGRESS, IN_REVIEW, DONE）
- 优先级（LOW, MEDIUM, HIGH）
- 负责人
- 截止日期
- 关联需求

### Project (项目)
- 项目名称、描述
- 状态、开始日期、结束日期

## API 端点

### 需求管理
- `GET /api/requirements` - 获取所有需求
- `POST /api/requirements` - 创建新需求
- `PATCH /api/requirements/[id]` - 更新需求
- `DELETE /api/requirements/[id]` - 删除需求

### 任务管理
- `GET /api/tasks` - 获取所有任务
- `POST /api/tasks` - 创建新任务
- `PATCH /api/tasks/[id]` - 更新任务
- `DELETE /api/tasks/[id]` - 删除任务

## 后续扩展建议

1. **用户认证与权限**：集成 NextAuth.js 实现用户登录和角色权限管理
2. **实时协作**：使用 WebSocket 实现实时更新和团队协作
3. **文件上传**：支持需求文档、设计稿的上传和管理
4. **评论系统**：为需求和任务添加评论讨论功能
5. **通知系统**：邮件或应用内通知提醒
6. **数据可视化**：使用图表库展示项目进度和团队绩效
7. **移动端优化**：响应式设计优化和 PWA 支持
8. **导出功能**：支持导出报告为 PDF、Excel 等格式
9. **甘特图**：项目时间线和里程碑可视化
10. **集成第三方工具**：与 Slack、GitHub、Jira 等工具集成

## 开发提示

- 使用 `npx prisma studio` 可视化管理数据库
- 修改 `schema.prisma` 后需运行 `npx prisma migrate dev` 创建迁移
- 使用 TypeScript 严格模式确保类型安全
- shadcn/ui 组件可通过 `npx shadcn@latest add [component]` 添加

## License

MIT
