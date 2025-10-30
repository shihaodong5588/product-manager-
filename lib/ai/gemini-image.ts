import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ImageGenerationInput {
  prompt: string;
  platform?: 'web' | 'ios' | 'android';
  styleType?: 'wireframe' | 'high_fidelity' | 'sketch';
  aspectRatio?: string; // e.g., "16:9", "9:16", "1:1"
  outputFormat?: 'PNG' | 'JPEG' | 'WEBP';
}

export interface ImageGenerationOutput {
  imageBase64: string;
  mimeType: string;
  metadata: {
    model: string;
    promptTokens?: number;
    generationTime: number;
  };
}

export interface ImageAnalysisInput {
  imageBase64: string; // Base64 编码的图片
  mimeType: string; // e.g., "image/png", "image/jpeg"
  prompt?: string; // 自定义分析提示词
  analysisType?: 'wireframe_analysis' | 'ui_review' | 'accessibility_check' | 'component_extraction';
}

export interface ImageAnalysisOutput {
  analysis: string; // Markdown 格式的分析结果
  structuredData?: {
    components?: Array<{
      type: string;
      description: string;
      position?: string;
    }>;
    suggestions?: string[];
    issues?: Array<{
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
  };
  metadata: {
    model: string;
    tokensUsed?: number;
    processingTime: number;
  };
}

export class GeminiImageService {
  private genAI: GoogleGenerativeAI;
  private imageModel: string;
  private visionModel: string;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.imageModel = "gemini-2.5-flash-image"; // 用于图片生成的模型 (Nano Banana)
    this.visionModel = "gemini-2.5-flash"; // 用于图片分析的模型
  }

  /**
   * 生成原型图/线框图
   */
  async generatePrototypeImage(input: ImageGenerationInput): Promise<ImageGenerationOutput> {
    const startTime = Date.now();

    // 构建适合图片生成的提示词
    const imagePrompt = this.buildImageGenerationPrompt(input);

    const model = this.genAI.getGenerativeModel({
      model: this.imageModel,
    });

    try {
      console.log('🎨 Generating image with Gemini 2.5 Flash Image (Nano Banana)...');
      console.log('Prompt:', imagePrompt);

      // 使用 Gemini 2.5 Flash Image 生成图片
      const result = await model.generateContent(imagePrompt);
      const response = result.response;

      const processingTime = Date.now() - startTime;

      // 提取图片数据
      // Gemini API 返回的候选项中可能包含图片
      const candidates = response.candidates || [];

      if (candidates.length > 0 && candidates[0].content?.parts) {
        for (const part of candidates[0].content.parts) {
          // 检查是否有内联数据（图片）
          if ((part as any).inlineData) {
            const inlineData = (part as any).inlineData;
            const imageBase64 = `data:${inlineData.mimeType};base64,${inlineData.data}`;

            console.log('✅ Image generated successfully!');
            console.log('MIME type:', inlineData.mimeType);
            console.log('Data length:', inlineData.data.length);

            return {
              imageBase64,
              mimeType: inlineData.mimeType,
              metadata: {
                model: this.imageModel,
                promptTokens: response.usageMetadata?.totalTokenCount,
                generationTime: processingTime,
              },
            };
          }
        }
      }

      // 如果没有找到图片数据，抛出错误
      console.error('❌ No image data found in response');
      console.error('Response structure:', JSON.stringify(response, null, 2));
      throw new Error('Failed to extract image from Gemini response');

    } catch (error) {
      console.error('❌ Failed to generate prototype image:', error);
      throw error;
    }
  }

  /**
   * 分析原型图/线框图
   */
  async analyzePrototypeImage(input: ImageAnalysisInput): Promise<ImageAnalysisOutput> {
    const startTime = Date.now();

    // 构建分析提示词
    const analysisPrompt = input.prompt || this.buildAnalysisPrompt(input.analysisType);

    const model = this.genAI.getGenerativeModel({
      model: this.visionModel,
    });

    try {
      // 准备图片数据
      const imageParts = [{
        inlineData: {
          data: input.imageBase64.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: input.mimeType,
        },
      }];

      // 调用 Gemini Vision API
      const result = await model.generateContent([analysisPrompt, ...imageParts]);
      const response = result.response;
      const text = response.text();

      const processingTime = Date.now() - startTime;

      // 尝试从响应中提取结构化数据
      const structuredData = this.extractStructuredData(text, input.analysisType);

      return {
        analysis: text,
        structuredData,
        metadata: {
          model: this.visionModel,
          tokensUsed: response.usageMetadata?.totalTokenCount,
          processingTime,
        },
      };
    } catch (error) {
      console.error('❌ Failed to analyze prototype image:', error);
      throw error;
    }
  }

  /**
   * 迭代优化原型图
   */
  async iteratePrototype(
    currentImageBase64: string,
    currentImageMimeType: string,
    feedback: string,
    requirements?: string
  ): Promise<ImageAnalysisOutput> {
    const prompt = `
# 原型图迭代优化

## 当前原型图
（请查看上传的图片）

## 用户反馈
${feedback}

${requirements ? `## 需求要点\n${requirements}` : ''}

## 任务
请根据用户反馈和需求要点，提供详细的优化建议：

1. **需要改进的地方**：列出当前设计的问题和不足
2. **具体优化方案**：针对每个问题提供具体的改进建议
3. **优先级排序**：按照重要性对优化建议进行排序
4. **实现建议**：提供技术实现上的建议

请以 Markdown 格式输出，结构清晰。
`;

    return this.analyzePrototypeImage({
      imageBase64: currentImageBase64,
      mimeType: currentImageMimeType,
      prompt,
      analysisType: 'ui_review',
    });
  }

  /**
   * 从需求文档生成原型图描述
   */
  async generatePrototypeFromRequirement(requirement: {
    title: string;
    description: string;
    platform: 'web' | 'ios' | 'android';
    styleType: 'wireframe' | 'high_fidelity' | 'sketch';
  }): Promise<string> {
    const prompt = `
# 需求转原型图描述

## 需求信息
- **标题**：${requirement.title}
- **描述**：${requirement.description}
- **平台**：${requirement.platform}
- **风格**：${requirement.styleType}

## 任务
请根据上述需求，生成一个详细的 ${requirement.platform} 平台${this.getStyleTypeName(requirement.styleType)}描述。

要求：
1. 详细描述页面布局结构
2. 列出所有UI组件及其位置
3. 说明交互流程和状态变化
4. 考虑${requirement.platform}平台的设计规范
5. 输出格式：结构化的 Markdown

请确保描述足够详细，能够指导设计师或开发人员实现。
`;

    const model = this.genAI.getGenerativeModel({
      model: this.imageModel,
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  }

  // ============ 私有辅助方法 ============

  private buildImageGenerationPrompt(input: ImageGenerationInput): string {
    const platformContext = this.getImagePlatformContext(input.platform || 'web');
    const styleContext = this.getImageStyleContext(input.styleType || 'wireframe');

    return `Create a ${styleContext} of a ${platformContext} interface based on this description:

${input.prompt}

Visual requirements:
- Clean, professional ${input.styleType || 'wireframe'} style
- Clear UI component separation
- Proper spacing and alignment
- ${input.aspectRatio || '16:9'} aspect ratio
- Focus on usability and clarity

Important: Generate an actual visual mockup/wireframe image, not text or code.`;
  }

  private getImagePlatformContext(platform: string): string {
    switch (platform) {
      case 'ios':
        return 'iOS mobile app';
      case 'android':
        return 'Android mobile app';
      case 'web':
      default:
        return 'web application';
    }
  }

  private getImageStyleContext(styleType: string): string {
    switch (styleType) {
      case 'wireframe':
        return 'low-fidelity wireframe mockup';
      case 'high_fidelity':
        return 'high-fidelity UI design';
      case 'sketch':
        return 'hand-drawn sketch style mockup';
      default:
        return 'wireframe mockup';
    }
  }

  private buildGenerationPrompt(input: ImageGenerationInput): string {
    const platformGuide = this.getPlatformGuide(input.platform || 'web');
    const styleGuide = this.getStyleGuide(input.styleType || 'wireframe');

    return `
# UI/UX 原型图设计描述生成

## 设计要求
- **平台**：${input.platform || 'web'}
- **风格**：${this.getStyleTypeName(input.styleType || 'wireframe')}
- **比例**：${input.aspectRatio || '16:9'}

## 用户需求
${input.prompt}

## 平台设计规范
${platformGuide}

## 风格指南
${styleGuide}

## 任务
请生成一个详细的原型图设计描述，包括：

1. **整体布局**：页面的整体结构和布局方式
2. **组件列表**：详细列出所有UI组件（按钮、输入框、卡片等）及其位置
3. **视觉层次**：说明信息的层次结构和视觉重点
4. **交互说明**：关键交互点和状态变化
5. **响应式考虑**：不同屏幕尺寸下的适配方案（如适用）

输出格式：Markdown，结构清晰，便于开发人员理解和实现。
`;
  }

  private buildAnalysisPrompt(analysisType?: string): string {
    switch (analysisType) {
      case 'wireframe_analysis':
        return `
# 线框图分析

请分析这个线框图，提供以下信息：

1. **布局结构**：描述整体布局和信息架构
2. **UI组件识别**：列出所有可识别的UI组件
3. **交互流程**：推测可能的用户交互路径
4. **设计建议**：提供改进建议和最佳实践

输出格式：Markdown
`;

      case 'ui_review':
        return `
# UI设计评审

请对这个UI设计进行专业评审：

1. **视觉设计**：评价视觉层次、配色、字体等
2. **可用性**：分析用户体验和易用性
3. **一致性**：检查设计规范的一致性
4. **可访问性**：评估无障碍设计
5. **改进建议**：提供具体的优化方向

输出格式：Markdown，包含优先级标记
`;

      case 'accessibility_check':
        return `
# 无障碍设计检查

请检查这个设计的无障碍性（Accessibility）：

1. **对比度**：文字与背景的对比度是否足够
2. **可读性**：字体大小和行距是否合适
3. **触摸目标**：按钮和可点击元素大小是否足够
4. **导航**：是否便于键盘导航和屏幕阅读器使用
5. **改进建议**：列出需要改进的地方

输出格式：Markdown，包含问题严重程度标记
`;

      case 'component_extraction':
        return `
# UI组件提取

请从这个设计中提取所有UI组件：

对每个组件提供：
1. **组件类型**：按钮、输入框、卡片等
2. **位置**：在页面中的大致位置
3. **样式特征**：尺寸、颜色、边框等关键样式
4. **交互状态**：正常、悬停、点击、禁用等状态

输出格式：Markdown 表格或列表
`;

      default:
        return `
# 原型图/设计稿分析

请详细分析这个设计：

1. **整体印象**：设计风格和特点
2. **布局分析**：页面结构和组件布局
3. **组件清单**：列出所有UI组件
4. **交互设计**：可能的交互模式和用户流程
5. **优化建议**：从UI/UX角度提供改进建议

输出格式：Markdown
`;
    }
  }

  private getPlatformGuide(platform: string): string {
    switch (platform) {
      case 'ios':
        return `
遵循 iOS Human Interface Guidelines：
- 使用 SF Pro 字体
- 采用卡片式设计
- 底部标签栏导航
- 系统手势支持
- 44×44pt 最小点击区域
`;
      case 'android':
        return `
遵循 Material Design 规范：
- 使用 Roboto 字体
- Material 卡片和阴影
- 浮动操作按钮 (FAB)
- 抽屉式导航
- 48×48dp 最小点击区域
`;
      case 'web':
      default:
        return `
Web 设计最佳实践：
- 响应式布局
- 清晰的导航结构
- 标准的交互模式
- 良好的可访问性
- 跨浏览器兼容
`;
    }
  }

  private getStyleGuide(styleType: string): string {
    switch (styleType) {
      case 'wireframe':
        return `
线框图风格：
- 简洁的黑白灰配色
- 基本的几何形状
- 占位符文本和图片
- 聚焦于布局和结构
- 不包含详细视觉设计
`;
      case 'high_fidelity':
        return `
高保真设计风格：
- 完整的配色方案
- 真实的文本内容
- 实际的图片素材
- 详细的视觉样式
- 完整的交互状态
`;
      case 'sketch':
        return `
手绘风格：
- 手绘线条感
- 不规则的形状
- 创意草图风格
- 强调概念和想法
- 快速迭代友好
`;
      default:
        return '';
    }
  }

  private getStyleTypeName(styleType: string): string {
    const names: Record<string, string> = {
      wireframe: '线框图',
      high_fidelity: '高保真设计稿',
      sketch: '手绘草图',
    };
    return names[styleType] || styleType;
  }

  private extractStructuredData(
    analysisText: string,
    analysisType?: string
  ): ImageAnalysisOutput['structuredData'] {
    // 这是一个简单的实现，实际应该使用更复杂的解析逻辑
    // 或者让 Gemini 直接输出 JSON 格式

    if (analysisType === 'component_extraction') {
      // 尝试从文本中提取组件信息
      // 这里只是示例，实际需要更智能的解析
      return {
        components: [],
        suggestions: [],
      };
    }

    return undefined;
  }
}

/**
 * 创建 Gemini Image Service 实例
 */
export function createGeminiImageService(): GeminiImageService {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GeminiImageService(apiKey);
}
