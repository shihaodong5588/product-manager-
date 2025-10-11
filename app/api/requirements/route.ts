import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const requirements = await prisma.requirement.findMany({
      include: {
        tasks: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(requirements)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch requirements' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const requirement = await prisma.requirement.create({
      data: {
        title: body.title,
        description: body.description,
        priority: body.priority,
        tags: body.tags || null,
      },
    })
    return NextResponse.json(requirement)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create requirement' }, { status: 500 })
  }
}
