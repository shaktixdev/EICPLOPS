import React from 'react'
import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  delta?: {
    value: string
    isPositive?: boolean
  }
}

export function KPICard({ title, value, subtitle, icon: Icon, delta }: KPICardProps) {
  return (
    <div className="p-6 rounded-2xl bg-white flex flex-col justify-between shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-shadow border border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold text-gray-900 numeral tracking-tight">
            {value}
          </span>
          {delta && (
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full numeral ${
                delta.isPositive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {delta.isPositive ? '↑' : '↓'} {delta.value}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[13px] text-gray-400 mt-2 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
