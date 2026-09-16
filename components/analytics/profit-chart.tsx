'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { fetchTrips, type TripItem } from '@/lib/client-data'

export function ProfitChart() {
  const [trips, setTrips] = useState<TripItem[]>([])

  useEffect(() => {
    fetchTrips()
      .then(setTrips)
      .catch(console.error)
  }, [])

  const data = useMemo(() => {
    return [...trips]
      .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())
      .map((t) => ({
        name: new Date(t.departureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        freight: t.freightAmount,
        profit: t.netProfit,
        fuel: t.fuelExpenses,
      }))
  }, [trips])

  if (data.length === 0) {
    return (
      <div className="w-full h-72 flex items-center justify-center text-sm text-[var(--text-muted)]">
        No trip data yet — dispatch trips to see P&L trends.
      </div>
    )
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
          <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
          />
          <Bar dataKey="freight" fill="var(--bg-subtle)" radius={[4, 4, 0, 0]} name="Gross Freight" />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#0d6b54"
            strokeWidth={3}
            dot={{ r: 4, fill: '#0d6b54' }}
            name="Net Profit"
          />
          <Line
            type="monotone"
            dataKey="fuel"
            stroke="#e05a5a"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            name="Fuel Expenses"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
