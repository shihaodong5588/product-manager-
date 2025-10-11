import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        assignedTasks: {
          include: {
            requirement: {
              select: {
                id: true,
                title: true,
                status: true
              }
            },
            project: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        projectMemberships: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                status: true,
                startDate: true,
                endDate: true
              }
            }
          }
        },
        activities: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 50
        }
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate stats
    const totalTasks = user.assignedTasks.length
    const completedTasks = user.assignedTasks.filter(t => t.status === 'DONE').length
    const activeTasks = user.assignedTasks.filter(t => t.status !== 'DONE').length
    const overdueTasks = user.assignedTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
    ).length

    return NextResponse.json({
      ...user,
      stats: {
        totalTasks,
        completedTasks,
        activeTasks,
        overdueTasks
      }
    })
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) {
      // Check if new email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email }
      })
      if (existingUser && existingUser.id !== id) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
      updateData.email = body.email
    }
    if (body.avatar !== undefined) updateData.avatar = body.avatar
    if (body.role !== undefined) updateData.role = body.role

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if user has assigned tasks
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        assignedTasks: true,
        projectMemberships: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Optional: Prevent deletion if user has active tasks
    const activeTasks = user.assignedTasks.filter(t => t.status !== 'DONE')
    if (activeTasks.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with active tasks. Please reassign or complete tasks first.' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
