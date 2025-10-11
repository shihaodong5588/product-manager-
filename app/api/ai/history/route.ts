import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 获取分析历史记录
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceType = searchParams.get('sourceType');
  const analysisType = searchParams.get('analysisType');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const where: any = {};
    if (sourceType) where.sourceType = sourceType;
    if (analysisType) where.analysisType = analysisType;

    const analyses = await prisma.aIAnalysis.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        analysisType: true,
        sourceType: true,
        sourceId: true,
        inputContent: true,
        analysisResult: true,
        userPrompt: true,
        modelUsed: true,
        tokensUsed: true,
        processingTime: true,
        rating: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
