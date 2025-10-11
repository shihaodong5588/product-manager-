import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    const where = role ? { role } : {}

    const users = await prisma.user.findMany({
      where,
      include: {
        assignedTasks: {
          select: { id: true, status: true }
        },
        projectMemberships: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        },
        activities: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Calculate stats for each user
    const usersWithStats = users.map(user => {
      const totalTasks = user.assignedTasks.length
      const completedTasks = user.assignedTasks.filter(t => t.status === 'DONE').length
      const activeTasks = user.assignedTasks.filter(t => t.status !== 'DONE').length

      return {
        ...user,
        _count: {
          assignedTasks: user.assignedTasks.length,
          projectMemberships: user.projectMemberships.length,
          activities: user.activities.length
        },
        stats: {
          totalTasks,
          completedTasks,
          activeTasks
        }
      }
    })

    return NextResponse.json(usersWithStats)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        avatar: body.avatar || null,
        role: body.role || 'member',
      },
      include: {
        assignedTasks: true,
        projectMemberships: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        },
        activities: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
