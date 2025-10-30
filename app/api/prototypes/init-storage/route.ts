import { NextRequest, NextResponse } from 'next/server'
import { initializeStorageBucket } from '@/lib/supabase-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/prototypes/init-storage
 * 初始化 Supabase Storage Bucket（只需运行一次）
 */
export async function POST(request: NextRequest) {
  try {
    await initializeStorageBucket()

    return NextResponse.json({
      success: true,
      message: 'Supabase Storage bucket initialized successfully',
    })
  } catch (error) {
    console.error('Error initializing storage bucket:', error)
    return NextResponse.json(
      {
        error: 'Failed to initialize storage bucket',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'The bucket may already exist, or there might be a permissions issue.',
      },
      { status: 500 }
    )
  }
}
