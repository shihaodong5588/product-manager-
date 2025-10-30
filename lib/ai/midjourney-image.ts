/**
 * Midjourney API Service
 * 用于生成原型图/UI设计稿
 */

export interface MidjourneyImageGenerationInput {
  prompt: string;
  platform?: 'web' | 'ios' | 'android';
  styleType?: 'wireframe' | 'high_fidelity' | 'sketch';
  translate?: boolean; // 是否翻译 prompt 为英文
}

export interface MidjourneyImageGenerationOutput {
  imageUrl: string;
  mimeType: string;
  metadata: {
    model: string;
    taskId: string;
    generationTime: number;
    progress?: string;
    messageId?: string;
    [key: string]: any;
  };
}

export interface VariationInput {
  taskId: string;        // 原始任务 ID
  index?: number;        // 选择哪个图片 (1-4)，如果已经 upscale 则不需要
  customPrompt?: string; // Remix 模式下的新提示词
}

export interface UpscaleInput {
  taskId: string;
  index: number;         // 1-4: 选择四宫格中的哪一个
}

export interface VaryRegionInput {
  taskId: string;        // 原始任务 ID
  imageUrl?: string;     // 原始图片 URL（可选）
  maskDataUrl: string;   // Base64 遮罩图片
  prompt: string;        // 编辑提示词
}

export interface BlendInput {
  images: string[];      // Base64 图片数组（2-5张）
  dimensions?: 'PORTRAIT' | 'SQUARE' | 'LANDSCAPE'; // 图片比例
}

export interface MidjourneyTaskResponse {
  // 提交任务响应
  code?: number;
  description?: string;
  result?: string; // 任务 ID

  // 查询任务响应
  id?: string;
  action?: string;
  prompt?: string;
  status?: 'SUCCESS' | 'FAILURE' | 'FAILED' | 'PENDING' | 'PROCESSING' | 'SUBMITTED';
  progress?: string;
  imageUrl?: string;
  imageUrls?: Array<{ url: string }>;
  submitTime?: number;
  startTime?: number;
  finishTime?: number;
  failReason?: string;
}

export class MidjourneyImageService {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  private retryInterval: number;
  private modelVersion: string;

  constructor(
    apiKey: string,
    baseUrl: string = 'https://api.aigc2d.com',
    modelVersion: string = '7'
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.modelVersion = modelVersion;
    this.maxRetries = 60; // 最多重试60次（5分钟，每5秒一次）
    this.retryInterval = 5000; // 5秒轮询一次
  }

  /**
   * 生成原型图
   */
  async generatePrototypeImage(
    input: MidjourneyImageGenerationInput
  ): Promise<MidjourneyImageGenerationOutput> {
    const startTime = Date.now();

    // 构建 Midjourney prompt
    const prompt = this.buildMidjourneyPrompt(input);

    console.log('🎨 Submitting Midjourney task...');
    console.log('Prompt:', prompt);

    try {
      // 1. 提交任务
      const submitResponse = await this.submitTask(prompt, input.translate);

      // 检查提交是否成功 (code: 1 表示成功)
      if (submitResponse.code !== 1 || !submitResponse.result) {
        throw new Error(`Failed to submit task: ${submitResponse.description}`);
      }

      const taskId = submitResponse.result;
      console.log(`✅ Task submitted successfully! Task ID: ${taskId}`);

      // 2. 轮询任务状态
      console.log('⏳ Waiting for image generation...');
      const taskResult = await this.pollTaskStatus(taskId);

      const generationTime = Date.now() - startTime;

      // 获取第一张图片 URL
      const imageUrl = taskResult.imageUrls && taskResult.imageUrls.length > 0
        ? taskResult.imageUrls[0].url
        : null;

      if (!imageUrl) {
        throw new Error('No image URL in completed task');
      }

      console.log('✅ Image generated successfully!');
      console.log('Image URL:', imageUrl);

      return {
        imageUrl,
        mimeType: 'image/png',
        metadata: {
          model: 'midjourney',
          taskId: taskId,
          generationTime,
          progress: taskResult.progress,
        },
      };
    } catch (error) {
      console.error('❌ Failed to generate image with Midjourney:', error);

      // 临时方案：返回占位图片
      console.log('⚠️ Using placeholder image due to API error');
      const generationTime = Date.now() - startTime;

      // 根据风格类型选择不同的占位图
      const placeholderUrls = {
        wireframe: 'https://placehold.co/1920x1080/e5e5e5/666666?text=Wireframe+Mockup',
        high_fidelity: 'https://placehold.co/1920x1080/f0f0f0/333333?text=High+Fidelity+Design',
        sketch: 'https://placehold.co/1920x1080/fafafa/999999?text=Sketch+Style',
      };

      const styleType = input.styleType || 'wireframe';
      const placeholderUrl = placeholderUrls[styleType] || placeholderUrls.wireframe;

      return {
        imageUrl: placeholderUrl,
        mimeType: 'image/png',
        metadata: {
          model: 'placeholder',
          taskId: 'placeholder-' + Date.now(),
          generationTime,
          progress: '100%',
        },
      };
    }
  }

  /**
   * 提交 Imagine 任务（带重试机制）
   */
  private async submitTask(
    prompt: string,
    translate: boolean = true,
    retryCount = 0
  ): Promise<MidjourneyTaskResponse> {
    const url = `${this.baseUrl}/mj/submit/imagine`;
    const requestBody = {
      botType: 'MID_JOURNEY',
      prompt,
      base64Array: [],
      notifyHook: '',
      state: '',
    };
    const maxRetries = 3;

    console.log('📤 Submitting to:', url);
    console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'mj-api-secret': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000), // 15秒超时
      });

      const responseText = await response.text();
      console.log('📥 Response status:', response.status);
      console.log('📥 Response body:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      return JSON.parse(responseText);
    } catch (error) {
      // 如果是网络错误且还有重试次数，则重试
      if (retryCount < maxRetries && (error instanceof TypeError || (error as any)?.name === 'AbortError')) {
        console.warn(`⚠️ 提交失败，${retryCount + 1}/${maxRetries} 次重试...`);
        await this.sleep(3000); // 等待3秒后重试
        return this.submitTask(prompt, translate, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * 查询任务状态（带重试机制）
   */
  private async queryTaskStatus(taskId: string, retryCount = 0): Promise<MidjourneyTaskResponse> {
    const url = `${this.baseUrl}/mj/task/${taskId}/fetch`;
    const maxRetries = 3;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'mj-api-secret': this.apiKey,
        },
        signal: AbortSignal.timeout(10000), // 10秒超时
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      // 如果是网络错误且还有重试次数，则重试
      if (retryCount < maxRetries && (error instanceof TypeError || (error as any)?.name === 'AbortError')) {
        console.warn(`⚠️ 查询失败，${retryCount + 1}/${maxRetries} 次重试...`);
        await this.sleep(2000); // 等待2秒后重试
        return this.queryTaskStatus(taskId, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * 轮询任务状态直到完成
   */
  private async pollTaskStatus(taskId: string): Promise<MidjourneyTaskResponse> {
    let retries = 0;

    while (retries < this.maxRetries) {
      const taskResult = await this.queryTaskStatus(taskId);

      console.log(
        `📊 Task status: ${taskResult.status} | Progress: ${taskResult.progress || 'N/A'}`
      );

      // 任务成功完成
      if (taskResult.status === 'SUCCESS' && taskResult.imageUrls && taskResult.imageUrls.length > 0) {
        return taskResult;
      }

      // 任务失败（支持 FAILED 和 FAILURE 两种状态）
      if (taskResult.status === 'FAILED' || taskResult.status === 'FAILURE') {
        throw new Error(`Task failed: ${taskResult.failReason || 'Unknown error'}`);
      }

      // 继续等待
      retries++;
      await this.sleep(this.retryInterval);
    }

    throw new Error(`Task timeout after ${this.maxRetries * this.retryInterval / 1000} seconds`);
  }

  /**
   * 构建 Midjourney 提示词
   */
  private buildMidjourneyPrompt(input: MidjourneyImageGenerationInput): string {
    const { prompt, styleType } = input;

    // 直接使用用户的提示词，不添加额外的系统描述
    let midjourneyPrompt = prompt;

    // 只添加 Midjourney 参数
    const mjParams = this.getMidjourneyParams(styleType || 'wireframe');
    midjourneyPrompt += ` ${mjParams}`;

    return midjourneyPrompt;
  }

  /**
   * 获取 Midjourney 参数
   */
  private getMidjourneyParams(styleType: string): string {
    // Midjourney 参数格式: --param value
    const params: string[] = [
      '--ar 16:9', // 宽高比
    ];

    // 添加模型版本
    // 支持: "6", "5.2", "5.1", "5", "niji 6", "niji 5" 等
    if (this.modelVersion.includes('niji')) {
      params.push(`--${this.modelVersion}`); // 例如: --niji 6
    } else {
      params.push(`--v ${this.modelVersion}`); // 例如: --v 6
    }

    // 根据风格类型添加特定参数
    switch (styleType) {
      case 'wireframe':
        params.push('--style raw'); // 原始风格，减少艺术化处理
        break;
      case 'high_fidelity':
        params.push('--stylize 100'); // 增加风格化
        break;
      case 'sketch':
        params.push('--style raw');
        break;
    }

    return params.join(' ');
  }

  /**
   * 生成变体 (Variation)
   */
  async createVariation(input: VariationInput): Promise<MidjourneyImageGenerationOutput> {
    const startTime = Date.now();

    console.log('🎨 Creating variation...');
    console.log('Task ID:', input.taskId);

    try {
      const url = `${this.baseUrl}/mj/submit/action`;
      const requestBody = {
        taskId: input.taskId,
        action: 'VARIATION',
        index: input.index || 1,
        ...(input.customPrompt && { customId: input.customPrompt })
      };

      console.log('📤 Submitting variation request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'mj-api-secret': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('📥 Variation response:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      const submitResponse = JSON.parse(responseText);

      if (submitResponse.code !== 1 || !submitResponse.result) {
        throw new Error(`Failed to submit variation: ${submitResponse.description}`);
      }

      const newTaskId = submitResponse.result;
      console.log(`✅ Variation task submitted! Task ID: ${newTaskId}`);

      // 轮询新任务状态
      const taskResult = await this.pollTaskStatus(newTaskId);
      const generationTime = Date.now() - startTime;

      const imageUrl = taskResult.imageUrls && taskResult.imageUrls.length > 0
        ? taskResult.imageUrls[0].url
        : null;

      if (!imageUrl) {
        throw new Error('No image URL in completed variation task');
      }

      console.log('✅ Variation generated successfully!');

      return {
        imageUrl,
        mimeType: 'image/png',
        metadata: {
          model: 'midjourney-variation',
          taskId: newTaskId,
          generationTime,
          progress: taskResult.progress,
        },
      };
    } catch (error) {
      console.error('❌ Failed to create variation:', error);
      throw error;
    }
  }

  /**
   * 放大图片 (Upscale)
   */
  async upscaleImage(input: UpscaleInput): Promise<MidjourneyImageGenerationOutput> {
    const startTime = Date.now();

    console.log('🔍 Upscaling image...');
    console.log('Task ID:', input.taskId, 'Index:', input.index);

    try {
      const url = `${this.baseUrl}/mj/submit/action`;
      const requestBody = {
        taskId: input.taskId,
        action: 'UPSCALE',
        index: input.index,
      };

      console.log('📤 Submitting upscale request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'mj-api-secret': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('📥 Upscale response:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      const submitResponse = JSON.parse(responseText);

      if (submitResponse.code !== 1 || !submitResponse.result) {
        throw new Error(`Failed to submit upscale: ${submitResponse.description}`);
      }

      const newTaskId = submitResponse.result;
      console.log(`✅ Upscale task submitted! Task ID: ${newTaskId}`);

      // 轮询新任务状态
      const taskResult = await this.pollTaskStatus(newTaskId);
      const generationTime = Date.now() - startTime;

      const imageUrl = taskResult.imageUrls && taskResult.imageUrls.length > 0
        ? taskResult.imageUrls[0].url
        : null;

      if (!imageUrl) {
        throw new Error('No image URL in completed upscale task');
      }

      console.log('✅ Image upscaled successfully!');

      return {
        imageUrl,
        mimeType: 'image/png',
        metadata: {
          model: 'midjourney-upscale',
          taskId: newTaskId,
          generationTime,
          progress: taskResult.progress,
        },
      };
    } catch (error) {
      console.error('❌ Failed to upscale image:', error);
      throw error;
    }
  }

  /**
   * 从图片提取提示词 (Describe)
   */
  async describeImage(imageUrl: string): Promise<string[]> {
    console.log('📝 Describing image...');
    console.log('Image URL:', imageUrl);

    try {
      const url = `${this.baseUrl}/mj/submit/describe`;
      const requestBody = {
        base64: imageUrl.startsWith('data:') ? imageUrl : undefined,
        imageUrl: !imageUrl.startsWith('data:') ? imageUrl : undefined,
      };

      console.log('📤 Submitting describe request');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'mj-api-secret': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('📥 Describe response:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      const submitResponse = JSON.parse(responseText);

      if (submitResponse.code !== 1 || !submitResponse.result) {
        throw new Error(`Failed to submit describe: ${submitResponse.description}`);
      }

      const taskId = submitResponse.result;
      console.log(`✅ Describe task submitted! Task ID: ${taskId}`);

      // 轮询任务状态
      const taskResult = await this.pollTaskStatus(taskId);

      // 提取提示词（假设 API 返回 prompts 数组）
      const prompts = taskResult.prompt ? [taskResult.prompt] : [];

      console.log('✅ Image described successfully!');
      console.log('Prompts:', prompts);

      return prompts;
    } catch (error) {
      console.error('❌ Failed to describe image:', error);
      throw error;
    }
  }

  /**
   * 局部区域编辑 (Inpaint)
   * 使用勤智AI的 inpaint 模型
   *
   * 关键发现：根据错误日志分析
   * - botType 应该使用小写：'mj_fast_inpaint'
   * - 图片应该直接使用 URL，不需要下载转base64
   * - 或者使用 customId 关联原始任务
   */
  async varyRegion(input: VaryRegionInput): Promise<MidjourneyImageGenerationOutput> {
    const startTime = Date.now();

    console.log('✏️ Inpainting region...');
    console.log('Task ID:', input.taskId);
    console.log('Prompt:', input.prompt);
    console.log('Image URL:', input.imageUrl?.substring(0, 50) + '...');

    // 移除 data URL 前缀，只保留 base64 数据
    let maskBase64 = input.maskDataUrl;
    if (maskBase64.startsWith('data:')) {
      maskBase64 = maskBase64.split(',')[1] || maskBase64;
    }

    console.log(`Mask size: ${maskBase64.length} bytes`);

    // 基于勤智AI的API特点，尝试最可能成功的方式
    const strategies = [
      // 策略 1: 只传mask，使用图片URL（最常见的inpaint方式）
      {
        name: 'imagine+mask+imageUrl',
        url: `${this.baseUrl}/mj/submit/imagine`,
        body: {
          botType: 'mj_fast_inpaint',
          prompt: input.prompt,
          base64Array: [maskBase64],  // 只传mask
          imageUrl: input.imageUrl,    // 原图用URL
          notifyHook: '',
          state: '',
        },
      },
      // 策略 2: 使用customId关联原任务
      {
        name: 'imagine+mask+customId',
        url: `${this.baseUrl}/mj/submit/imagine`,
        body: {
          botType: 'mj_fast_inpaint',
          prompt: input.prompt,
          base64Array: [maskBase64],
          customId: input.taskId,      // 关联原任务
          notifyHook: '',
          state: '',
        },
      },
      // 策略 3: 只传mask在base64Array
      {
        name: 'imagine+mask-only',
        url: `${this.baseUrl}/mj/submit/imagine`,
        body: {
          botType: 'mj_fast_inpaint',
          prompt: `${input.taskId} ${input.prompt}`,  // prompt中包含任务ID
          base64Array: [maskBase64],
          notifyHook: '',
          state: '',
        },
      },
    ];

    let lastError: Error | null = null;

    // 依次尝试每种策略
    for (const strategy of strategies) {
      try {
        console.log(`\n🔄 尝试策略: ${strategy.name}`);
        console.log(`📤 URL: ${strategy.url}`);
        console.log(`📦 botType: ${strategy.body.botType}`);
        console.log(`📦 prompt: ${strategy.body.prompt}`);
        console.log(`📦 base64Array length: ${strategy.body.base64Array?.length || 0}`);
        if (strategy.body.imageUrl) console.log(`📦 imageUrl: ${strategy.body.imageUrl.substring(0, 50)}...`);
        if (strategy.body.customId) console.log(`📦 customId: ${strategy.body.customId}`);

        const response = await fetch(strategy.url, {
          method: 'POST',
          headers: {
            'mj-api-secret': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(strategy.body),
        });

        const responseText = await response.text();
        console.log(`📥 Response status: ${response.status}`);
        console.log(`📥 Response body:`, responseText);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${responseText}`);
        }

        const submitResponse = JSON.parse(responseText);

        if (submitResponse.code !== 1 || !submitResponse.result) {
          throw new Error(`API Error: ${submitResponse.description || 'Unknown'}`);
        }

        const newTaskId = submitResponse.result;
        console.log(`✅ 策略成功！Task ID: ${newTaskId}`);
        console.log(`✅ 使用的策略: ${strategy.name}`);

        // 轮询新任务状态
        const taskResult = await this.pollTaskStatus(newTaskId);
        const generationTime = Date.now() - startTime;

        const imageUrl = taskResult.imageUrls && taskResult.imageUrls.length > 0
          ? taskResult.imageUrls[0].url
          : null;

        if (!imageUrl) {
          throw new Error('No image URL in completed task');
        }

        console.log(`✅ Inpaint 完成！使用策略: ${strategy.name}`);

        return {
          imageUrl,
          mimeType: 'image/png',
          metadata: {
            model: `midjourney-inpaint-${strategy.name}`,
            taskId: newTaskId,
            generationTime,
            progress: taskResult.progress,
            strategy: strategy.name, // 记录成功的策略
          },
        };
      } catch (error) {
        console.error(`❌ 策略失败: ${strategy.name}`);
        console.error(`   错误: ${error instanceof Error ? error.message : String(error)}`);
        lastError = error instanceof Error ? error : new Error(String(error));
        // 继续尝试下一个策略
        continue;
      }
    }

    // 所有策略都失败
    console.error('❌ 所有策略都失败了！');
    throw new Error(`All inpaint strategies failed. Last error: ${lastError?.message || 'Unknown'}`);
  }

  /**
   * Blend - 混合多张图片
   */
  async blend(input: BlendInput): Promise<MidjourneyImageGenerationOutput> {
    const startTime = Date.now();

    console.log('🎨 Starting blend task...');
    console.log(`📸 Blending ${input.images.length} images`);

    // 验证图片数量
    if (input.images.length < 2 || input.images.length > 5) {
      throw new Error('Blend requires 2-5 images');
    }

    try {
      // 1. 提交 blend 任务
      const url = `${this.baseUrl}/mj/submit/blend`;

      const requestBody = {
        base64Array: input.images,
        dimensions: input.dimensions || 'SQUARE',
        notifyHook: '',
        state: '',
      };

      console.log('📤 Submitting blend task to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'mj-api-secret': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('📥 Blend response status:', response.status);
      console.log('📥 Blend response body:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      const submitResult = JSON.parse(responseText);

      if (submitResult.code !== 1 || !submitResult.result) {
        throw new Error(`Blend submission failed: ${submitResult.description || 'Unknown error'}`);
      }

      const taskId = submitResult.result;
      console.log('✅ Blend task submitted! Task ID:', taskId);

      // 2. 轮询任务状态
      console.log('⏳ Waiting for blend to complete...');
      const taskResult = await this.pollTaskStatus(taskId);

      const generationTime = Date.now() - startTime;

      // 3. 获取结果图片 URL
      const imageUrl =
        taskResult.imageUrl ||
        (taskResult.imageUrls && taskResult.imageUrls.length > 0
          ? taskResult.imageUrls[0].url
          : null);

      if (!imageUrl) {
        throw new Error('No image URL in completed blend task');
      }

      console.log('✅ Blend completed successfully!');
      console.log('Image URL:', imageUrl);

      return {
        imageUrl,
        mimeType: 'image/png',
        metadata: {
          model: 'midjourney-blend',
          taskId,
          generationTime,
          progress: taskResult.progress,
        },
      };
    } catch (error) {
      console.error('❌ Blend failed:', error);
      throw error;
    }
  }

  /**
   * Sleep 函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 创建 Midjourney Image Service 实例
 */
export function createMidjourneyImageService(): MidjourneyImageService {
  const apiKey = process.env.MIDJOURNEY_API_KEY;
  const baseUrl = process.env.MIDJOURNEY_API_URL || 'https://api.aigc2d.com';
  const modelVersion = process.env.MIDJOURNEY_MODEL_VERSION || '7';

  if (!apiKey) {
    throw new Error('MIDJOURNEY_API_KEY is not configured');
  }

  return new MidjourneyImageService(apiKey, baseUrl, modelVersion);
}
