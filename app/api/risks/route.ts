import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Custom ordering for risk levels: CRITICAL > HIGH > MEDIUM > LOW
const riskLevelOrder = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const level = searchParams.get('level')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {}

    if (projectId) {
      where.projectId = projectId
    }

    if (level) {
      where.level = level as any
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { owner: { contains: search, mode: 'insensitive' } },
      ]
    }

    const risks = await prisma.risk.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Sort by level (CRITICAL first) then by createdAt
    const sortedRisks = risks.sort((a, b) => {
      const levelDiff = riskLevelOrder[a.level as keyof typeof riskLevelOrder] - riskLevelOrder[b.level as keyof typeof riskLevelOrder]
      if (levelDiff !== 0) return levelDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json(sortedRisks)
  } catch (error) {
    console.error('Failed to fetch risks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch risks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!body.projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const risk = await prisma.risk.create({
      data: {
        title: body.title,
        description: body.description || null,
        level: body.level || 'MEDIUM',
        impact: body.impact || null,
        mitigation: body.mitigation || null,
        owner: body.owner || null,
        status: body.status || 'open',
        projectId: body.projectId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json(risk, { status: 201 })
  } catch (error) {
    console.error('Failed to create risk:', error)
    return NextResponse.json(
      { error: 'Failed to create risk' },
      { status: 500 }
    )
  }
}
