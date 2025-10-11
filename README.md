# 📊 产品管理系统

一个基于 Next.js 15 构建的现代化产品管理系统，集成 Google Gemini AI 智能助手，提供完整的项目管理解决方案。

## ✨ 主要功能

### 核心模块
- **📋 需求管理** - 创建、编辑、跟踪需求，支持优先级和状态管理
- **✅ 任务看板** - Kanban 风格的任务管理，支持拖拽和任务分配
- **📊 项目管理** - 项目创建、成员分配、进度跟踪
- **⚠️ 风险管理** - 风险识别、评估和缓解策略跟踪
- **🎯 里程碑** - 项目里程碑管理和进度可视化
- **👥 团队成员** - 团队成员管理，支持角色权限（管理员/经理/成员/观众）
- **📈 活动动态** - 实时活动流，跟踪所有项目变更

### AI 智能助手
- **🤖 Gemini 2.5 集成** - 智能需求分析和建议
- **💡 多模型支持** - Flash（快速）、Pro（强大）、Lite（轻量）三种模型可选
- **📝 分析历史** - 查看和管理历史分析记录
- **🎨 实时切换** - 界面内即时切换 AI 模型

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 15 (App Router + Turbopack)
- **语言**: TypeScript
- **UI 库**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS 4
- **图标**: Lucide React
- **拖拽**: @dnd-kit

### 后端
- **数据库**: SQLite (Prisma ORM)
- **AI**: Google Gemini 2.5 API
- **验证**: Zod

### 开发工具
- ESLint
- TypeScript
- Prisma Studio

## 🚀 快速开始

### 环境要求
- Node.js 18.17+
- npm / yarn / pnpm

### 1. 克隆项目
```bash
git clone https://github.com/shihaodong5588/product-manager-.git
cd product-manager-
```

### 2. 安装依赖
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 3. 配置环境变量
创建 `.env` 文件并添加以下配置：

```env
# Gemini API 密钥 (必需)
GEMINI_API_KEY=your_gemini_api_key_here

# Gemini 模型 (可选，默认: gemini-2.5-flash)
GEMINI_MODEL=gemini-2.5-flash

# 数据库 URL (可选，默认使用 SQLite)
DATABASE_URL="file:./prisma/dev.db"
```

**获取 Gemini API Key**:
1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 创建新的 API 密钥
3. 复制密钥到 `.env` 文件

### 4. 初始化数据库
```bash
# 执行数据库迁移
npx prisma migrate dev

# (可选) 填充示例数据
npx prisma db seed
```

### 5. 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📦 可用脚本

```bash
# 开发模式 (启用 Turbopack)
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# Prisma Studio (数据库管理界面)
npx prisma studio
```

## 🗂️ 项目结构

```
product-manager/
├── app/                    # Next.js App Router
│   ├── activity/          # 活动动态页面
│   ├── ai-assistant/      # AI 助手页面
│   ├── api/               # API 路由
│   ├── milestones/        # 里程碑页面
│   ├── projects/          # 项目管理页面
│   ├── requirements/      # 需求管理页面
│   ├── risks/             # 风险管理页面
│   ├── tasks/             # 任务看板页面
│   └── team/              # 团队成员页面
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 组件
│   ├── app-sidebar.tsx   # 侧边栏导航
│   ├── dashboard.tsx     # 仪表盘
│   └── kanban-board.tsx  # 看板组件
├── lib/                   # 工具库
│   ├── ai/               # AI 相关模块
│   │   ├── gemini-service.ts      # Gemini API 服务
│   │   ├── analysis-engine.ts     # 分析引擎
│   │   └── prompt-templates.ts    # 提示词模板
│   ├── prisma.ts         # Prisma 客户端
│   └── utils.ts          # 工具函数
├── prisma/               # 数据库
│   ├── schema.prisma     # 数据库模型
│   ├── migrations/       # 迁移文件
│   └── seed.ts          # 种子数据
└── public/              # 静态资源
```

## 🎯 核心功能使用指南

### AI 助手使用
1. 进入 **AI 助手** 页面
2. 选择分析来源（需求/任务/项目）
3. 选择分析类型（需求分析/功能建议/风险评估等）
4. 可选择 AI 模型：
   - **Flash**: 快速响应，适合日常分析
   - **Pro**: 最强性能，适合复杂分析
   - **Lite**: 超快速，适合简单查询
5. 点击"开始分析"获取 AI 建议

### 任务看板
- **拖拽**: 直接拖动任务卡片改变状态
- **快速创建**: 点击"创建新任务"快速添加任务
- **筛选**: 按优先级、负责人筛选任务

### 团队协作
- **角色管理**:
  - 👑 管理员 - 完全权限
  - 🔧 经理 - 管理项目和团队
  - 👤 成员 - 执行任务
  - 👁️ 观众 - 只读权限

## 🔒 安全建议

- ✅ `.env` 文件已在 `.gitignore` 中，不会提交到 Git
- ✅ 生产环境请使用环境变量管理敏感信息
- ✅ 定期更新依赖包以修复安全漏洞
- ⚠️ 数据库文件 `prisma/dev.db` 包含测试数据，生产环境请使用云数据库

## 📝 开发指南

### 添加新功能
1. 创建功能分支：`git checkout -b feature/功能名`
2. 开发并测试
3. 提交更改：`git commit -m "feat: 功能描述"`
4. 推送分支：`git push origin feature/功能名`
5. 创建 Pull Request

### 提交规范
使用语义化提交信息：
- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 重构
- `test:` 测试
- `chore:` 构建/工具

## 🐛 问题反馈

如遇到问题，请：
1. 检查 [Issues](https://github.com/shihaodong5588/product-manager-/issues) 是否已有相关问题
2. 创建新 Issue 并提供详细信息
3. 包含错误日志和复现步骤

## 📄 许可证

本项目采用 MIT 许可证。

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [Google Gemini](https://ai.google.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

⭐ 如果这个项目对你有帮助，欢迎点个 Star！
