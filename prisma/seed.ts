import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: '张三',
        email: 'zhangsan@example.com',
        role: 'admin',
      },
    }),
    prisma.user.create({
      data: {
        name: '李四',
        email: 'lisi@example.com',
        role: 'manager',
      },
    }),
    prisma.user.create({
      data: {
        name: '王五',
        email: 'wangwu@example.com',
        role: 'member',
      },
    }),
    prisma.user.create({
      data: {
        name: '赵六',
        email: 'zhaoliu@example.com',
        role: 'member',
      },
    }),
  ])

  console.log('✅ Created users')

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: '电商平台改版',
        description: '重新设计电商平台UI/UX，提升用户体验',
        status: 'ACTIVE',
        budget: 500000,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
      },
    }),
    prisma.project.create({
      data: {
        name: '移动App开发',
        description: '开发iOS和Android原生应用',
        status: 'ACTIVE',
        budget: 800000,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-08-31'),
      },
    }),
    prisma.project.create({
      data: {
        name: '数据分析平台',
        description: '构建实时数据分析和可视化平台',
        status: 'PLANNING',
        budget: 600000,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-09-30'),
      },
    }),
  ])

  console.log('✅ Created projects')

  // Add project members
  await Promise.all([
    prisma.projectMember.create({
      data: {
        projectId: projects[0].id,
        userId: users[0].id,
        role: 'owner',
      },
    }),
    prisma.projectMember.create({
      data: {
        projectId: projects[0].id,
        userId: users[1].id,
        role: 'manager',
      },
    }),
    prisma.projectMember.create({
      data: {
        projectId: projects[0].id,
        userId: users[2].id,
        role: 'member',
      },
    }),
    prisma.projectMember.create({
      data: {
        projectId: projects[1].id,
        userId: users[0].id,
        role: 'owner',
      },
    }),
    prisma.projectMember.create({
      data: {
        projectId: projects[1].id,
        userId: users[3].id,
        role: 'member',
      },
    }),
  ])

  console.log('✅ Created project members')

  // Create requirements
  const requirements = await Promise.all([
    prisma.requirement.create({
      data: {
        title: '用户登录功能优化',
        description: '支持多种登录方式：手机号、邮箱、第三方登录',
        priority: 'HIGH',
        status: 'IN_DEVELOPMENT',
        tags: '登录,安全,用户体验',
        estimatedHours: 40,
        actualHours: 25,
        projectId: projects[0].id,
      },
    }),
    prisma.requirement.create({
      data: {
        title: '商品搜索功能增强',
        description: '实现智能搜索、联想搜索、搜索历史',
        priority: 'HIGH',
        status: 'APPROVED',
        tags: '搜索,AI,推荐',
        estimatedHours: 60,
        projectId: projects[0].id,
      },
    }),
    prisma.requirement.create({
      data: {
        title: '购物车优化',
        description: '支持批量操作、优惠券计算、库存检查',
        priority: 'MEDIUM',
        status: 'IN_TESTING',
        tags: '购物车,优惠',
        estimatedHours: 30,
        actualHours: 28,
        projectId: projects[0].id,
      },
    }),
    prisma.requirement.create({
      data: {
        title: '支付流程改进',
        description: '简化支付步骤，支持多种支付方式',
        priority: 'HIGH',
        status: 'SUBMITTED',
        tags: '支付,体验',
        estimatedHours: 50,
        projectId: projects[0].id,
      },
    }),
    prisma.requirement.create({
      data: {
        title: 'App首页设计',
        description: '设计简洁现代的App首页布局',
        priority: 'HIGH',
        status: 'IN_DEVELOPMENT',
        tags: 'UI,设计',
        estimatedHours: 35,
        actualHours: 20,
        projectId: projects[1].id,
      },
    }),
  ])

  console.log('✅ Created requirements')

  // Create tasks
  await Promise.all([
    prisma.task.create({
      data: {
        title: '设计登录页面UI',
        description: '设计现代化的登录界面',
        status: 'DONE',
        priority: 'HIGH',
        assigneeId: users[2].id,
        estimatedHours: 8,
        actualHours: 7,
        requirementId: requirements[0].id,
        projectId: projects[0].id,
        order: 1,
      },
    }),
    prisma.task.create({
      data: {
        title: '实现手机号登录API',
        description: '开发手机号验证码登录接口',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assigneeId: users[3].id,
        estimatedHours: 16,
        actualHours: 10,
        requirementId: requirements[0].id,
        projectId: projects[0].id,
        dueDate: new Date('2025-10-15'),
        order: 2,
      },
    }),
    prisma.task.create({
      data: {
        title: '集成第三方登录SDK',
        description: '接入微信、支付宝登录',
        status: 'TODO',
        priority: 'MEDIUM',
        assigneeId: users[3].id,
        estimatedHours: 12,
        requirementId: requirements[0].id,
        projectId: projects[0].id,
        dueDate: new Date('2025-10-20'),
        order: 3,
      },
    }),
    prisma.task.create({
      data: {
        title: '搜索算法优化',
        description: '实现基于Elasticsearch的智能搜索',
        status: 'TODO',
        priority: 'HIGH',
        assigneeId: users[2].id,
        estimatedHours: 24,
        requirementId: requirements[1].id,
        projectId: projects[0].id,
        dueDate: new Date('2025-10-25'),
        order: 1,
      },
    }),
    prisma.task.create({
      data: {
        title: '购物车批量操作功能',
        description: '实现全选、批量删除、批量收藏',
        status: 'IN_REVIEW',
        priority: 'MEDIUM',
        assigneeId: users[2].id,
        estimatedHours: 10,
        actualHours: 9,
        requirementId: requirements[2].id,
        projectId: projects[0].id,
        order: 1,
      },
    }),
    prisma.task.create({
      data: {
        title: 'App导航设计',
        description: '设计底部导航栏',
        status: 'DONE',
        priority: 'HIGH',
        assigneeId: users[2].id,
        estimatedHours: 6,
        actualHours: 5,
        requirementId: requirements[4].id,
        projectId: projects[1].id,
        order: 1,
      },
    }),
  ])

  console.log('✅ Created tasks')

  // Create milestones
  await Promise.all([
    prisma.milestone.create({
      data: {
        title: 'Alpha版本发布',
        description: '完成核心功能开发',
        status: 'COMPLETED',
        dueDate: new Date('2025-03-31'),
        completedAt: new Date('2025-03-28'),
        projectId: projects[0].id,
      },
    }),
    prisma.milestone.create({
      data: {
        title: 'Beta测试开始',
        description: '开放给内部用户测试',
        status: 'IN_PROGRESS',
        dueDate: new Date('2025-10-15'),
        projectId: projects[0].id,
      },
    }),
    prisma.milestone.create({
      data: {
        title: '正式上线',
        description: '产品正式发布',
        status: 'UPCOMING',
        dueDate: new Date('2025-12-01'),
        projectId: projects[0].id,
      },
    }),
    prisma.milestone.create({
      data: {
        title: 'iOS App提交审核',
        description: '提交到App Store审核',
        status: 'UPCOMING',
        dueDate: new Date('2025-08-15'),
        projectId: projects[1].id,
      },
    }),
  ])

  console.log('✅ Created milestones')

  // Create risks
  await Promise.all([
    prisma.risk.create({
      data: {
        title: '第三方API不稳定',
        description: '依赖的第三方登录API可能不稳定',
        level: 'HIGH',
        impact: '可能导致用户无法登录',
        mitigation: '准备备用方案，添加降级策略',
        owner: '张三',
        status: 'open',
        projectId: projects[0].id,
      },
    }),
    prisma.risk.create({
      data: {
        title: '性能瓶颈',
        description: '高并发情况下搜索性能可能下降',
        level: 'MEDIUM',
        impact: '搜索响应时间增加',
        mitigation: '增加缓存层，优化数据库查询',
        owner: '李四',
        status: 'mitigated',
        projectId: projects[0].id,
      },
    }),
    prisma.risk.create({
      data: {
        title: '设计延期风险',
        description: 'UI设计可能无法按时完成',
        level: 'LOW',
        impact: '影响开发进度',
        mitigation: '增加设计师资源',
        owner: '王五',
        status: 'open',
        projectId: projects[1].id,
      },
    }),
  ])

  console.log('✅ Created risks')

  // Create activities
  await Promise.all([
    prisma.activity.create({
      data: {
        type: 'project_created',
        description: '创建了项目 "电商平台改版"',
        userId: users[0].id,
        entityType: 'project',
        entityId: projects[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'requirement_created',
        description: '创建了需求 "用户登录功能优化"',
        userId: users[0].id,
        entityType: 'requirement',
        entityId: requirements[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'task_created',
        description: '创建了任务 "设计登录页面UI"',
        userId: users[1].id,
        entityType: 'task',
        entityId: requirements[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'task_completed',
        description: '完成了任务 "设计登录页面UI"',
        userId: users[2].id,
        entityType: 'task',
        entityId: requirements[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        type: 'milestone_reached',
        description: '达成里程碑 "Alpha版本发布"',
        userId: users[0].id,
        entityType: 'milestone',
        entityId: projects[0].id,
      },
    }),
  ])

  console.log('✅ Created activities')

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
