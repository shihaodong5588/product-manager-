# Midjourney API 配置说明

## 概述

原型图生成功能已从 Gemini Nano Banana 切换到 **Midjourney API**。

## 配置步骤

### 1. 获取 Midjourney API Key

根据您提供的 API 文档（https://apiai.apifox.cn/folder-31977042），您需要：

1. 访问 API 服务提供商网站（如 AIGC2D: https://api.aigc2d.com）
2. 注册账号并获取 API Token（格式通常为 `sk-xxx`）
3. 确保账户有足够的余额或配额

### 2. 配置环境变量

在项目根目录的 `.env` 文件中添加以下配置：

```env
# Midjourney API Configuration
MIDJOURNEY_API_KEY="your-api-key-here"  # 替换为您的 API Key
MIDJOURNEY_API_URL="https://api.aigc2d.com"  # API 基础 URL（可选，默认值）
```

**示例：**
```env
MIDJOURNEY_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
MIDJOURNEY_API_URL="https://api.aigc2d.com"
```

### 3. 重启开发服务器

配置完成后，重启开发服务器使环境变量生效：

```bash
npm run dev
```

## 使用说明

### API 工作流程

1. **提交任务**: 调用 `/midjourney/imagine` 接口，提交图片生成任务
2. **获取 Task ID**: API 返回任务 ID
3. **轮询状态**: 每 5 秒查询一次任务状态
4. **获取结果**: 任务完成后返回图片 URL

### 生成时间

- Midjourney 图片生成通常需要 **30-120 秒**
- 系统会自动轮询任务状态，最长等待 5 分钟
- 生成过程中会显示进度百分比

### 支持的风格

所有三种风格都使用 Midjourney 生成真实图片：

1. **线框图 (Wireframe)**:
   - 黑白简约风格
   - 清晰的线条和布局
   - Midjourney 参数: `--style raw --ar 16:9 --v 7`

2. **高保真 (High Fidelity)**:
   - 彩色详细设计
   - 现代化 UI 风格
   - Midjourney 参数: `--stylize 100 --ar 16:9 --v 7`

3. **手绘 (Sketch)**:
   - 手绘素描风格
   - 艺术化表现
   - Midjourney 参数: `--style raw --ar 16:9 --v 7`

### 模型版本说明

**Midjourney V7** (默认，推荐):
- 发布于 2025 年 4 月，6 月成为默认模型
- 改进的提示精确度和图像质量
- 更好的手部、身体和物体连贯性
- 更丰富的纹理和细节
- 支持 Draft Mode（草稿模式）: 成本减半，速度快10倍

**其他可用版本**:
- V6: 上一代主力模型
- V5.2, V5.1, V5: 旧版本
- Niji 6, Niji 5: 动漫风格专用模型

### 自动翻译

系统会自动将中文提示词翻译为英文后提交给 Midjourney，无需手动翻译。

## 技术细节

### API 端点

```typescript
// 提交任务
POST https://api.aigc2d.com/midjourney/imagine
Headers:
  Authorization: Bearer {MIDJOURNEY_API_KEY}
  Content-Type: application/json
Body:
  {
    "prompt": "your prompt here",
    "translate": true  // 自动翻译
  }

// 查询任务状态
GET https://api.aigc2d.com/midjourney/task/{task_id}
Headers:
  Authorization: Bearer {MIDJOURNEY_API_KEY}
```

### 响应格式

**提交任务响应：**
```json
{
  "code": 0,
  "task_id": "442275063214085100",
  "message": "success"
}
```

**任务状态响应：**
```json
{
  "code": 0,
  "message": "success",
  "task_id": "442275063214085100",
  "status": "SUCCESS",
  "progress": "100%",
  "image_url": "https://mjcdn.aigc2d.com/xxxxxx",
  "submit_time": "2023-07-23 20:01:53",
  "finish_time": "2023-07-23 20:02:42"
}
```

### 任务状态

- `PENDING`: 等待中
- `SUBMITTED`: 已提交
- `PROCESSING`: 生成中
- `SUCCESS`: 成功完成
- `FAILED`: 失败

## 费用说明

Midjourney API 通常是**付费服务**，请确保：

1. 账户有足够的余额
2. 了解每次生成的费用
3. 设置合理的配额限制

## 故障排除

### 1. API Key 错误
```
Error: MIDJOURNEY_API_KEY is not configured
```
**解决方案**: 检查 `.env` 文件中是否正确配置了 `MIDJOURNEY_API_KEY`

### 2. 认证失败
```
HTTP error! status: 401
```
**解决方案**:
- 检查 API Key 是否正确
- 确认 API Key 是否已激活
- 检查账户是否有效

### 3. 配额不足
```
HTTP error! status: 429
```
**解决方案**:
- 检查账户余额
- 等待配额重置
- 升级账户套餐

### 4. 任务超时
```
Task timeout after 300 seconds
```
**解决方案**:
- Midjourney 服务可能繁忙，稍后重试
- 检查网络连接
- 联系 API 服务提供商

### 5. 生成失败
```
Task failed: {error message}
```
**解决方案**:
- 检查提示词是否符合 Midjourney 规范
- 避免使用违禁词汇
- 简化提示词内容

## 与 Gemini 的对比

| 特性 | Gemini Nano Banana | Midjourney |
|------|-------------------|------------|
| 生成速度 | ~5-10 秒 | ~30-120 秒 |
| 图片质量 | 中等 | 高质量 |
| 费用 | 免费配额有限 | 付费服务 |
| 风格控制 | 基础 | 强大 |
| 稳定性 | 一般 | 高 |
| 返回格式 | Base64 | 图片 URL |

## 参考资料

- API 文档: https://apiai.apifox.cn/folder-31977042
- AIGC2D 文档: https://docs.aigc2d.com/
- Midjourney 官方文档: https://docs.midjourney.com/

## 需要帮助？

如果遇到问题，请：
1. 检查上述故障排除部分
2. 查看服务器日志获取详细错误信息
3. 联系 API 服务提供商技术支持
