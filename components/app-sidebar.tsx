'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, KanbanSquare, FolderKanban, Users, Target, AlertTriangle, Activity, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: '概览', href: '/', icon: LayoutDashboard },
  { name: 'AI 助手', href: '/ai-assistant', icon: Brain },
  { name: '需求管理', href: '/requirements', icon: FileText },
  { name: '任务看板', href: '/tasks', icon: KanbanSquare },
  { name: '项目', href: '/projects', icon: FolderKanban },
  { name: '里程碑', href: '/milestones', icon: Target },
  { name: '风险管理', href: '/risks', icon: AlertTriangle },
  { name: '团队成员', href: '/team', icon: Users },
  { name: '活动日志', href: '/activity', icon: Activity },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">产品管理系统</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            U
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">用户名</p>
            <p className="text-xs text-muted-foreground">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
