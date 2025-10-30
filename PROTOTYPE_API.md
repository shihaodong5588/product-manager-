# 原型图功能 API 文档

## 概述

原型图功能使用 Google Gemini 2.5 Flash AI 模型，提供以下核心能力：
- 根据文字描述生成详细的原型图/线框图设计文档
- 分析上传的原型图并提供专业建议
- 基于用户反馈进行迭代优化
- 完整的 CRUD 操作支持

## 技术栈

- **AI 模型**: Google Gemini 2.5 Flash
- **图片存储**: Supabase Storage
- **数据库**: PostgreSQL (via Prisma ORM)
- **框架**: Next.js 15 API Routes

## API 端点

### 1. 初始化 Storage Bucket

**POST** `/api/prototypes/init-storage`

初始化 Supabase Storage bucket（首次使用时需要运行一次）。

**请求示例:**
```bash
curl -X POST http://localhost:3001/api/prototypes/init-storage
```

**响应示例:**
```json
{
  "success": true,
  "message": "Supabase Storage bucket initialized successfully"
}
```

---

### 2. 生成原型图

**POST** `/api/prototypes/generate`

根据文字描述生成详细的原型图设计文档。

**请求体:**
```json
{
  "title": "电商购物车页面",
  "description": "设计一个简洁美观的购物车页面",
  "promptText": "需要一个电商购物车页面，包含商品列表、数量调整、价格计算、优惠券输入、结算按钮等功能",
  "platform": "web",          // "web" | "ios" | "android"
  "styleType": "wireframe",   // "wireframe" | "high_fidelity" | "sketch"
  "requirementId": "xxx",     // 可选：关联的需求 ID
  "projectId": "xxx"          // 可选：关联的项目 ID
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "cmgumboru00018cizg992p31p",
    "title": "电商购物车页面",
    "description": "设计一个简洁美观的购物车页面",
    "generationType": "text_to_image",
    "platform": "web",
    "styleType": "wireframe",
    "analysisResult": {
      "description": "# 电商购物车页面线框图描述...",
      "generatedAt": "2025-10-17T09:00:05.865Z"
    },
    "modelUsed": "gemini-2.5-flash",
    "generationTime": 28896,
    "status": "draft",
    "createdAt": "2025-10-17T09:00:09.642Z",
    ...
  },
  "message": "Prototype description generated successfully. Image generation coming soon.",
  "note": "Currently Gemini 2.5 Flash does not support direct image generation..."
}
```

---

### 3. 分析原型图

**POST** `/api/prototypes/analyze`

上传图片并使用 Gemini Vision 进行分析。

**请求体:**
```json
{
  "title": "首页设计稿",
  "description": "分析首页的 UI 设计",
  "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "imageMimeType": "image/png",
  "analysisType": "wireframe_analysis",  // "wireframe_analysis" | "ui_review" | "accessibility_check" | "component_extraction"
  "platform": "web",
  "styleType": "wireframe",
  "requirementId": "xxx",     // 可选
  "projectId": "xxx"          // 可选
}
```

**分析类型说明:**
- `wireframe_analysis`: 线框图分析，识别布局结构和组件
- `ui_review`: UI 设计评审，评价视觉设计和可用性
- `accessibility_check`: 无障碍设计检查
- `component_extraction`: UI 组件提取

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "xxx",
    "title": "首页设计稿",
    "generationType": "image_analysis",
    "imageUrl": "https://xxx.supabase.co/storage/v1/object/public/prototypes/...",
    "imagePath": "2025/10/...",
    "analysisResult": { ... },
    "suggestions": "## 分析结果\n\n...",
    "identifiedComponents": [ ... ],
    ...
  },
  "analysis": "详细的分析文本...",
  "message": "Prototype analyzed successfully"
}
```

---

### 4. 迭代优化

**POST** `/api/prototypes/iterate`

基于现有原型图和用户反馈进行迭代优化。

**请求体:**
```json
{
  "parentPrototypeId": "cmgumboru00018cizg992p31p",
  "feedback": "购物车按钮需要更明显，颜色要用主色调",
  "requirements": "增加商品推荐区域，显示最近浏览的商品"  // 可选
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "new-id",
    "title": "电商购物车页面 (v2)",
    "parentId": "cmgumboru00018cizg992p31p",
    "version": 2,
    "suggestions": "## 优化建议\n\n...",
    ...
  },
  "optimization": "详细的优化建议...",
  "message": "Prototype iteration created successfully"
}
```

---

### 5. 获取原型图列表

**GET** `/api/prototypes`

获取原型图列表，支持多种筛选条件。

**查询参数:**
- `projectId`: 项目 ID
- `requirementId`: 需求 ID
- `status`: 状态 ("draft" | "final" | "archived")
- `platform`: 平台 ("web" | "ios" | "android")
- `styleType`: 风格类型
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 20）

**请求示例:**
```bash
curl "http://localhost:3001/api/prototypes?platform=web&status=draft&page=1&limit=10"
```

**响应示例:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 6. 获取单个原型图

**GET** `/api/prototypes/:id`

获取指定原型图的详细信息，包括父子版本关系。

**请求示例:**
```bash
curl http://localhost:3001/api/prototypes/cmgumboru00018cizg992p31p
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "id": "cmgumboru00018cizg992p31p",
    "title": "电商购物车页面",
    "parent": null,
    "children": [
      {
        "id": "child-id",
        "title": "电商购物车页面 (v2)",
        "version": 2,
        ...
      }
    ],
    ...
  }
}
```

---

### 7. 更新原型图

**PATCH** `/api/prototypes/:id`

更新原型图的基本信息。

**请求体:**
```json
{
  "title": "新标题",
  "description": "新描述",
  "status": "final",       // "draft" | "final" | "archived"
  "platform": "ios",
  "styleType": "high_fidelity",
  "requirementId": "xxx",
  "projectId": "xxx"
}
```

**响应示例:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Prototype updated successfully"
}
```

---

### 8. 删除原型图

**DELETE** `/api/prototypes/:id`

删除指定的原型图（包括 Supabase Storage 中的图片）。

**注意:** 如果原型图有子版本，必须先删除所有子版本。

**请求示例:**
```bash
curl -X DELETE http://localhost:3001/api/prototypes/cmgumboru00018cizg992p31p
```

**响应示例:**
```json
{
  "success": true,
  "message": "Prototype deleted successfully"
}
```

**错误响应（有子版本时）:**
```json
{
  "error": "Cannot delete prototype with child versions. Please delete child versions first.",
  "childrenCount": 3
}
```

---

## 数据模型

### Prototype 模型

```prisma
model Prototype {
  id              String   @id @default(cuid())
  title           String
  description     String?

  // 生成配置
  generationType  String   // 'text_to_image', 'image_analysis', 'requirement_based'
  platform        String   @default("web")
  styleType       String   @default("wireframe")

  // 输入内容
  promptText      String?
  sourceImageUrl  String?

  // Supabase Storage 信息
  imageUrl        String
  imagePath       String
  imageSize       Int?
  imageMimeType   String   @default("image/png")

  // AI 分析结果
  analysisResult  Json?
  suggestions     String?
  identifiedComponents Json?

  // 关联
  requirementId   String?
  requirement     Requirement? @relation(...)
  projectId       String?
  project         Project?     @relation(...)

  // 版本管理
  parentId        String?
  version         Int      @default(1)
  parent          Prototype?  @relation("PrototypeVersions", ...)
  children        Prototype[] @relation("PrototypeVersions")

  // AI 元数据
  modelUsed       String   @default("gemini-2.5-flash")
  generationTime  Int?
  promptTokens    Int?

  // 状态
  status          String   @default("draft")

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# Supabase API Keys
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Google Gemini API
GEMINI_API_KEY="your-gemini-api-key"
```

---

## 使用流程

### 基本流程

1. **首次使用**: 调用 `/api/prototypes/init-storage` 初始化 Storage bucket
2. **生成原型图**: 使用 `/api/prototypes/generate` 根据需求生成设计文档
3. **分析图片**: 使用 `/api/prototypes/analyze` 上传并分析设计稿
4. **迭代优化**: 使用 `/api/prototypes/iterate` 基于反馈优化设计
5. **查看管理**: 使用 CRUD API 进行查看、更新、删除操作

### 版本管理流程

1. 创建初始版本（v1）
2. 使用 `/api/prototypes/iterate` 创建迭代版本（v2, v3...）
3. 每个迭代版本通过 `parentId` 关联到父版本
4. 可以查看完整的版本树结构

---

## 注意事项

1. **图片生成限制**: 当前 Gemini 2.5 Flash 模型不支持直接生成图片，仅生成详细的设计描述文档
2. **图片上传**: 分析功能支持 Base64 编码的图片上传
3. **Storage 配置**: 确保 Supabase Storage bucket 已正确初始化
4. **版本依赖**: 删除父版本前必须先删除所有子版本
5. **API 限制**: Gemini API 有速率限制，请合理控制调用频率

---

## 错误处理

所有 API 在发生错误时返回统一格式：

```json
{
  "error": "错误描述",
  "details": "详细错误信息"
}
```

常见 HTTP 状态码：
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## 后续扩展

1. **集成图片生成服务**: 当 Gemini 支持图片生成或集成 DALL-E、Midjourney 等服务
2. **实时协作**: WebSocket 支持多人实时编辑和评论
3. **版本对比**: 可视化对比不同版本的差异
4. **导出功能**: 支持导出为 Figma、Sketch 等格式
5. **AI 辅助修改**: 直接通过 AI 指令修改原型图的特定部分
