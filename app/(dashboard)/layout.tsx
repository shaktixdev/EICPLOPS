'use client'

import React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { SidebarProvider, useSidebar } from '@/components/layout/sidebar-context'
import { RouteProgress } from '@/components/layout/page-transition'

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar()

  return (
    <div className="min-h-screen bg-background">
      <RouteProgress />
      <Sidebar />
      <div
        className={`pr-4 flex flex-col min-h-screen w-full transition-[padding] duration-300 ease-apple ${
          open ? 'pl-[252px]' : 'pl-[96px]'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <DashboardShell>{children}</DashboardShell>
    </SidebarProvider>
  )
}
