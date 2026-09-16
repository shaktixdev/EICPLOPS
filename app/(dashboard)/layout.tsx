'use client'

import React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { SidebarProvider, useSidebar } from '@/components/layout/sidebar-context'

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={`pr-4 flex flex-col min-h-screen w-full transition-all duration-300 ease-out ${
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
