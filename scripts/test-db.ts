import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('测试数据库连接...\n')

    // 1. 测试连接
    await prisma.$connect()
    console.log('✓ 数据库连接成功\n')

    // 2. 检查WorkItem总数
    const total = await prisma.workItem.count()
    console.log(`总工作项数: ${total}`)

    // 4. 获取前3条记录查看数据
    console.log('\n前3条记录:')
    const items = await prisma.workItem.findMany({
      take: 3,
      select: {
        id: true,
        title: true,
        workItemType: true,
        priority: true,
        importance: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    items.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.title}`)
      console.log(`   类型: ${item.workItemType}`)
      console.log(`   优先级: ${item.priority}`)
      console.log(`   重要性: ${item.importance}`)
      console.log(`   状态: ${item.status}`)
      console.log(`   创建时间: ${item.createdAt}`)
    })

    console.log('\n✓ 数据库测试完成')

  } catch (error) {
    console.error('\n✗ 数据库测试失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
