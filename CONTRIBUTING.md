# 贡献指南

感谢您考虑为产品管理系统做出贡献！

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [提交规范](#提交规范)
- [代码规范](#代码规范)

## 行为准则

请保持友好、专业和尊重的态度。我们希望为所有人营造一个开放和包容的环境。

## 如何贡献

### 报告 Bug

如果您发现了 bug，请：

1. 检查 [Issues](https://github.com/shihaodong5588/product-manager-/issues) 确认问题是否已被报告
2. 如果没有，创建新的 Issue，包含：
   - 清晰的标题
   - 详细的问题描述
   - 复现步骤
   - 预期行为 vs 实际行为
   - 截图（如适用）
   - 环境信息（操作系统、浏览器、Node.js 版本等）

### 提出新功能

如果您有新功能的想法：

1. 先创建一个 Issue 讨论该功能
2. 说明功能的用途和价值
3. 等待维护者反馈
4. 获得批准后再开始开发

### 提交代码

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 进行更改
4. 提交更改：`git commit -m 'feat: add amazing feature'`
5. 推送到分支：`git push origin feature/amazing-feature`
6. 创建 Pull Request

## 开发流程

### 1. 设置开发环境

```bash
# 克隆您 fork 的仓库
git clone https://github.com/YOUR_USERNAME/product-manager-.git
cd product-manager-

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 添加您的 API 密钥

# 初始化数据库
npx prisma migrate dev
npx prisma db seed

# 启动开发服务器
npm run dev
```

### 2. 开发新功能

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 进行开发...

# 运行 lint 检查
npm run lint

# 测试应用
npm run dev
```

### 3. 提交代码

```bash
# 添加更改
git add .

# 提交（遵循提交规范）
git commit -m "feat: your feature description"

# 推送到您的 fork
git push origin feature/your-feature-name
```

### 4. 创建 Pull Request

1. 访问您 fork 的仓库页面
2. 点击 "Pull Request"
3. 选择您的功能分支
4. 填写 PR 描述：
   - 更改内容
   - 相关 Issue
   - 测试说明
   - 截图（如适用）

## 提交规范

我们使用语义化提交信息（Conventional Commits）：

### 格式

```
<类型>(<范围>): <描述>

[可选的正文]

[可选的脚注]
```

### 类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构（既不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 添加测试
- `chore`: 构建过程或辅助工具的变动

### 示例

```bash
# 新功能
git commit -m "feat(tasks): add drag and drop sorting"

# 修复 bug
git commit -m "fix(api): resolve null pointer in user endpoint"

# 文档
git commit -m "docs: update API documentation"

# 样式
git commit -m "style: format code with prettier"

# 重构
git commit -m "refactor(auth): simplify login logic"
```

## 代码规范

### TypeScript

- 使用 TypeScript 编写所有代码
- 为函数添加类型注解
- 避免使用 `any` 类型
- 使用接口（interface）定义对象结构

```typescript
// ✅ 好的
interface User {
  id: string
  name: string
  email: string
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ 避免
function getUser(id: any): any {
  // ...
}
```

### React 组件

- 使用函数组件和 Hooks
- 为 props 定义类型
- 将复杂逻辑提取到自定义 hooks
- 组件名使用 PascalCase

```typescript
// ✅ 好的
interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {children}
    </button>
  )
}

// ❌ 避免
export function button(props: any) {
  return <button onClick={props.onClick}>{props.children}</button>
}
```

### 文件结构

- 页面组件放在 `app/` 目录
- 可复用组件放在 `components/` 目录
- UI 组件放在 `components/ui/` 目录
- 工具函数放在 `lib/` 目录
- API 路由放在 `app/api/` 目录

### 命名规范

- 文件名：kebab-case（如 `user-profile.tsx`）
- 组件名：PascalCase（如 `UserProfile`）
- 函数名：camelCase（如 `getUserById`）
- 常量名：UPPER_SNAKE_CASE（如 `API_BASE_URL`）

### CSS/样式

- 优先使用 Tailwind CSS 类
- 复杂样式使用 CSS Modules
- 遵循 Tailwind 的工具优先原则

```tsx
// ✅ 好的
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-bold">Title</h2>
</div>

// ❌ 避免内联样式
<div style={{ display: 'flex', padding: '16px' }}>
  <h2 style={{ fontSize: '20px' }}>Title</h2>
</div>
```

## Pull Request 检查清单

提交 PR 前，请确认：

- [ ] 代码遵循项目的代码规范
- [ ] 已运行 `npm run lint` 且无错误
- [ ] 已测试所有更改
- [ ] 更新了相关文档
- [ ] 提交信息遵循规范
- [ ] PR 描述清晰完整
- [ ] 已解决所有合并冲突

## 获取帮助

如有任何问题：

- 💬 在 Issue 中提问
- 📧 联系维护者
- 📖 查看 [README](README.md)

感谢您的贡献！🎉
