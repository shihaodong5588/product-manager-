import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AnalysisInput {
  content: string;
  prompt?: string;
  analysisType: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export interface AnalysisOutput {
  result: string;
  metadata: {
    model: string;
    tokensUsed?: number;
    processingTime: number;
  };
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string = "gemini-2.5-flash") {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async analyze(input: AnalysisInput): Promise<AnalysisOutput> {
    const startTime = Date.now();

    // Pro 模型需要更多 tokens（思考模式会占用额外 tokens）
    const maxTokens = this.model.includes('pro')
      ? (input.options?.maxTokens ?? 8192)  // Pro 模型默认 8192
      : (input.options?.maxTokens ?? 2048); // 其他模型默认 2048

    const model = this.genAI.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: input.options?.temperature ?? 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: maxTokens,
      },
    });

    // 构建完整提示词
    const fullPrompt = input.prompt || input.content;

    // 调用 Gemini API
    const result = await model.generateContent(fullPrompt);
    const response = result.response;

    // 检查是否有安全过滤或其他阻止原因
    if (!response.text) {
      console.error('No text in response:', {
        candidates: response.candidates,
        promptFeedback: response.promptFeedback,
      });
    }

    const text = response.text();

    const processingTime = Date.now() - startTime;

    return {
      result: text,
      metadata: {
        model: this.model,
        tokensUsed: response.usageMetadata?.totalTokenCount,
        processingTime,
      },
    };
  }

  getModelInfo() {
    return {
      provider: 'gemini' as const,
      model: this.model,
      maxTokens: 1000000,
    };
  }
}
