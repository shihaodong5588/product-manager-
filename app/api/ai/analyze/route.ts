import { NextResponse } from 'next/server';
import { AnalysisEngine } from '@/lib/ai/analysis-engine';

/**
 * 执行 AI 分析
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceType, sourceId, analysisType, userPrompt, model } = body;

    // 验证输入
    if (!sourceType || !sourceId || !analysisType) {
      return NextResponse.json(
        { error: '缺少必要参数：sourceType, sourceId, analysisType' },
        { status: 400 }
      );
    }

    // 验证分析类型
    const validTypes = ['requirement_analysis', 'risk_assessment', 'technical_feasibility'];
    if (!validTypes.includes(analysisType)) {
      return NextResponse.json(
        { error: '无效的分析类型' },
        { status: 400 }
      );
    }

    // 执行分析（传递可选的模型参数）
    const engine = new AnalysisEngine();
    const result = await engine.analyze({
      sourceType,
      sourceId,
      analysisType,
      userPrompt,
      model, // 传递用户选择的模型
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Analysis failed:', error);

    // 处理特定错误
    if (error.message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'AI 服务配置错误，请联系管理员' },
        { status: 500 }
      );
    }

    if (error.message.includes('Content not found')) {
      return NextResponse.json(
        { error: '未找到指定的内容' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || '分析失败，请重试' },
      { status: 500 }
    );
  }
}
