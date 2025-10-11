import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')

    const where: any = {}

    if (projectId) {
      where.projectId = projectId
    }

    if (status) {
      where.status = status
    }

    const milestones = await prisma.milestone.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    return NextResponse.json(milestones)
  } catch (error) {
    console.error('Failed to fetch milestones:', error)
    return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.projectId || !body.dueDate) {
      return NextResponse.json(
        { error: 'Title, projectId, and dueDate are required' },
        { status: 400 }
      )
    }

    const milestone = await prisma.milestone.create({
      data: {
        title: body.title,
        description: body.description || null,
        status: body.status || 'UPCOMING',
        dueDate: new Date(body.dueDate),
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        projectId: body.projectId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json(milestone)
  } catch (error) {
    console.error('Failed to create milestone:', error)
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 })
  }
}
