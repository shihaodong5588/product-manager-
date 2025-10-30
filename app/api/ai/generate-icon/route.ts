import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: '请提供图标描述' }, { status: 400 })
    }

    // 检查是否配置了API密钥
    const apiKey = process.env.MIDJOURNEY_API_KEY
    const apiUrl = process.env.MIDJOURNEY_API_URL

    if (!apiKey || !apiUrl) {
      return NextResponse.json(
        { error: '未配置Midjourney API，请联系管理员' },
        { status: 500 }
      )
    }

    // 优化prompt，专门用于生成工业图标
    const optimizedPrompt = `${prompt}, industrial icon, minimalist style, vector art, simple lines, monochrome, transparent background, suitable for dark UI, clean design --ar 1:1 --v 6`

    // 调用Midjourney API生成图标
    const response = await fetch(`${apiUrl}/mj/submit/imagine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mj-api-secret': apiKey,
      },
      body: JSON.stringify({
        prompt: optimizedPrompt,
        base64Array: [],
      }),
    })

    if (!response.ok) {
      throw new Error('生成图标失败')
    }

    const data = await response.json()

    if (data.code !== 1) {
      throw new Error(data.description || '生成失败')
    }

    const taskId = data.result

    // 轮询任务状态
    let attempts = 0
    const maxAttempts = 60 // 最多轮询60次（10分钟）

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000)) // 等待10秒

      const statusResponse = await fetch(`${apiUrl}/mj/task/${taskId}/fetch`, {
        headers: {
          'mj-api-secret': apiKey,
        },
      })

      if (!statusResponse.ok) {
        throw new Error('查询任务状态失败')
      }

      const statusData = await statusResponse.json()

      if (statusData.status === 'SUCCESS') {
        return NextResponse.json({
          iconUrl: statusData.imageUrl,
          taskId: taskId,
        })
      }

      if (statusData.status === 'FAILURE') {
        throw new Error(statusData.failReason || '生成失败')
      }

      attempts++
    }

    throw new Error('生成超时，请稍后重试')
  } catch (error) {
    console.error('生成图标失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败' },
      { status: 500 }
    )
  }
}
