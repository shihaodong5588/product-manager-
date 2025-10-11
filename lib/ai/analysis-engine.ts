import { GeminiService } from './gemini-service';
import { fillTemplate } from './prompt-templates';
import { prisma } from '@/lib/prisma';

/**
 * AI 分析引擎核心
 */
export class AnalysisEngine {
  private geminiService: GeminiService;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }

    // 从环境变量读取模型配置，默认使用 gemini-2.5-flash
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    this.geminiService = new GeminiService(apiKey, model);
  }

  /**
   * 执行分析
   */
  async analyze(params: {
    sourceType: string;
    sourceId: string;
    analysisType: string;
    userPrompt?: string;
    model?: string; // 可选的模型参数
  }) {
    // 1. 从数据库读取源内容
    const content = await this.fetchSourceContent(params.sourceType, params.sourceId);

    if (!content) {
      throw new Error(`Content not found: ${params.sourceType}/${params.sourceId}`);
    }

    // 2. 使用提示词模板
    const fullPrompt = fillTemplate(
      params.analysisType as any,
      {
        content,
        userPrompt: params.userPrompt,
      }
    );

    // 3. 如果用户指定了模型，创建新的 GeminiService 实例
    const geminiService = params.model
      ? new GeminiService(process.env.GEMINI_API_KEY!, params.model)
      : this.geminiService;

    // 4. 调用 Gemini
    const result = await geminiService.analyze({
      content,
      prompt: fullPrompt,
      analysisType: params.analysisType,
      options: {
        temperature: 0.2,
      },
    });

    // 5. 保存分析结果到数据库
    const analysis = await prisma.aIAnalysis.create({
      data: {
        analysisType: params.analysisType,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        inputContent: content,
        userPrompt: params.userPrompt,
        analysisResult: result.result,
        modelUsed: result.metadata.model,
        tokensUsed: result.metadata.tokensUsed,
        processingTime: result.metadata.processingTime,
      },
    });

    return {
      id: analysis.id,
      result: result.result,
      metadata: result.metadata,
    };
  }

  /**
   * 从数据库读取源内容并格式化为可分析的文本
   */
  private async fetchSourceContent(sourceType: string, sourceId: string): Promise<string | null> {
    switch (sourceType) {
      case 'requirement': {
        const req = await prisma.requirement.findUnique({
          where: { id: sourceId },
          include: { project: true },
        });
        if (!req) return null;

        return `# 需求：${req.title}

## 基本信息
- **优先级**：${req.priority}
- **状态**：${req.status}
- **预估工时**：${req.estimatedHours || '未设定'} 小时
- **实际工时**：${req.actualHours || '未开始'} 小时
- **关联项目**：${req.project?.name || '无'}
- **标签**：${req.tags || '无'}

## 需求描述
${req.description || '无详细描述'}

## 时间信息
- **创建时间**：${new Date(req.createdAt).toLocaleString('zh-CN')}
- **最后更新**：${new Date(req.updatedAt).toLocaleString('zh-CN')}`;
      }

      case 'task': {
        const task = await prisma.task.findUnique({
          where: { id: sourceId },
          include: {
            project: true,
            requirement: true,
            assignee: true,
          },
        });
        if (!task) return null;

        return `# 任务：${task.title}

## 基本信息
- **状态**：${task.status}
- **优先级**：${task.priority}
- **负责人**：${task.assignee?.name || '未分配'}
- **截止日期**：${task.dueDate ? new Date(task.dueDate).toLocaleDateString('zh-CN') : '未设定'}
- **预估工时**：${task.estimatedHours || '未设定'} 小时
- **实际工时**：${task.actualHours || '未开始'} 小时
- **关联项目**：${task.project?.name || '无'}
- **关联需求**：${task.requirement?.title || '无'}

## 任务描述
${task.description || '无详细描述'}

## 时间信息
- **创建时间**：${new Date(task.createdAt).toLocaleString('zh-CN')}
- **最后更新**：${new Date(task.updatedAt).toLocaleString('zh-CN')}`;
      }

      case 'project': {
        const project = await prisma.project.findUnique({
          where: { id: sourceId },
          include: {
            requirements: true,
            tasks: true,
            risks: true,
            milestones: true,
            members: { include: { user: true } },
          },
        });
        if (!project) return null;

        const completedTasks = project.tasks.filter(t => t.status === 'DONE').length;
        const progress = project.tasks.length > 0
          ? Math.round((completedTasks / project.tasks.length) * 100)
          : 0;

        return `# 项目：${project.name}

## 基本信息
- **状态**：${project.status}
- **预算**：${project.budget ? `¥${project.budget.toLocaleString()}` : '未设定'}
- **开始日期**：${project.startDate ? new Date(project.startDate).toLocaleDateString('zh-CN') : '未设定'}
- **结束日期**：${project.endDate ? new Date(project.endDate).toLocaleDateString('zh-CN') : '未设定'}

## 项目描述
${project.description || '无详细描述'}

## 项目规模
- **需求数量**：${project.requirements.length} 个
- **任务数量**：${project.tasks.length} 个
- **已完成任务**：${completedTasks} 个
- **进度**：${progress}%
- **里程碑**：${project.milestones.length} 个
- **风险项**：${project.risks.length} 个
- **团队成员**：${project.members.length} 人

## 团队成员
${project.members.map(m => `- ${m.user.name} (${m.role})`).join('\n')}

## 需求列表
${project.requirements.map(r => `- [${r.priority}] ${r.title} - ${r.status}`).join('\n') || '无'}

## 当前风险
${project.risks.map(r => `- [${r.level}] ${r.title} - ${r.status}`).join('\n') || '无'}`;
      }

      case 'risk': {
        const risk = await prisma.risk.findUnique({
          where: { id: sourceId },
          include: { project: true },
        });
        if (!risk) return null;

        return `# 风险：${risk.title}

## 基本信息
- **风险等级**：${risk.level}
- **状态**：${risk.status}
- **负责人**：${risk.owner || '未指定'}
- **关联项目**：${risk.project.name}

## 风险描述
${risk.description || '无详细描述'}

## 影响分析
${risk.impact || '未评估'}

## 缓解措施
${risk.mitigation || '无'}

## 时间信息
- **创建时间**：${new Date(risk.createdAt).toLocaleString('zh-CN')}
- **最后更新**：${new Date(risk.updatedAt).toLocaleString('zh-CN')}`;
      }

      default:
        return null;
    }
  }
}
