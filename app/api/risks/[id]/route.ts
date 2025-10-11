import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const risk = await prisma.risk.findUnique({
      where: { id },
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

    if (!risk) {
      return NextResponse.json(
        { error: 'Risk not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(risk)
  } catch (error) {
    console.error('Failed to fetch risk:', error)
    return NextResponse.json(
      { error: 'Failed to fetch risk' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if risk exists
    const existingRisk = await prisma.risk.findUnique({
      where: { id },
    })

    if (!existingRisk) {
      return NextResponse.json(
        { error: 'Risk not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.level !== undefined) updateData.level = body.level
    if (body.impact !== undefined) updateData.impact = body.impact
    if (body.mitigation !== undefined) updateData.mitigation = body.mitigation
    if (body.owner !== undefined) updateData.owner = body.owner
    if (body.status !== undefined) updateData.status = body.status
    if (body.projectId !== undefined) {
      // Validate project exists if projectId is being changed
      const project = await prisma.project.findUnique({
        where: { id: body.projectId },
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      updateData.projectId = body.projectId
    }

    const risk = await prisma.risk.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(risk)
  } catch (error) {
    console.error('Failed to update risk:', error)
    return NextResponse.json(
      { error: 'Failed to update risk' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if risk exists
    const existingRisk = await prisma.risk.findUnique({
      where: { id },
    })

    if (!existingRisk) {
      return NextResponse.json(
        { error: 'Risk not found' },
        { status: 404 }
      )
    }

    await prisma.risk.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete risk:', error)
    return NextResponse.json(
      { error: 'Failed to delete risk' },
      { status: 500 }
    )
  }
}
