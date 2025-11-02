import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateImportance() {
  try {
    console.log('开始更新所有工作项的重要性字段...')

    // 更新所有记录，确保都有importance值
    const result = await prisma.workItem.updateMany({
      data: {
        importance: 'MEDIUM'
      }
    })

    console.log(`✓ 成功更新 ${result.count} 条记录`)

    // 验证更新
    const total = await prisma.workItem.count()
    console.log(`总记录数: ${total}`)

  } catch (error) {
    console.error('更新失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateImportance()
