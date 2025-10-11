import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 获取可分析的内容列表
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'requirement' | 'task' | 'project' | 'risk' | 'all'

  try {
    const content: any[] = [];

    // 获取需求
    if (type === 'requirement' || type === 'all' || !type) {
      const requirements = await prisma.requirement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          status: true,
          createdAt: true,
        },
      });
      content.push(...requirements.map(r => ({
        id: r.id,
        title: r.title,
        preview: r.description?.substring(0, 100) || '无描述',
        type: 'requirement',
        metadata: {
          priority: r.priority,
          status: r.status,
        },
        createdAt: r.createdAt,
      })));
    }

    // 获取任务
    if (type === 'task' || type === 'all' || !type) {
      const tasks = await prisma.task.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      });
      content.push(...tasks.map(t => ({
        id: t.id,
        title: t.title,
        preview: t.description?.substring(0, 100) || '无描述',
        type: 'task',
        metadata: {
          status: t.status,
          priority: t.priority,
        },
        createdAt: t.createdAt,
      })));
    }

    // 获取项目
    if (type === 'project' || type === 'all' || !type) {
      const projects = await prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          createdAt: true,
        },
      });
      content.push(...projects.map(p => ({
        id: p.id,
        title: p.name,
        preview: p.description?.substring(0, 100) || '无描述',
        type: 'project',
        metadata: {
          status: p.status,
        },
        createdAt: p.createdAt,
      })));
    }

    // 获取风险
    if (type === 'risk' || type === 'all' || !type) {
      const risks = await prisma.risk.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          description: true,
          level: true,
          status: true,
          createdAt: true,
        },
      });
      content.push(...risks.map(r => ({
        id: r.id,
        title: r.title,
        preview: r.description?.substring(0, 100) || '无描述',
        type: 'risk',
        metadata: {
          level: r.level,
          status: r.status,
        },
        createdAt: r.createdAt,
      })));
    }

    // 按创建时间排序
    content.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to fetch content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
