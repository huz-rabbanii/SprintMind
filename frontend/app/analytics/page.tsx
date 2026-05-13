'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'

const COLORS = ['#6c63ff','#22c55e','#eab308','#ef4444','#00d4ff']

export default function AnalyticsPage() {
  const [ws, setWs]         = useState<any[]>([])
  const [selected, setSel]  = useState<string>('')
  const [data, setData]     = useState<any>(null)

  useEffect(() => {
    api.get('/api/workspaces/').then(r => {
      setWs(r.data)
      if (r.data[0]) setSel(r.data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    api.get(`/api/analytics/workspace/${selected}`).then(r => setData(r.data))
  }, [selected])

  const metrics = data ? [
    { label: 'Total Tasks',     value: data.total_tasks     },
    { label: 'Completed',       value: data.completed_tasks },
    { label: 'Overdue',         value: data.overdue_tasks   },
    { label: 'Completion Rate', value: `${data.completion_rate}%` },
  ] : []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted text-sm mt-1">Team productivity and sprint metrics.</p>
        </div>
        {ws.length > 1 && (
          <select
            className="bg-surface border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2 text-sm outline-none"
            value={selected}
            onChange={e => setSel(e.target.value)}
          >
            {ws.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {metrics.map(m => (
          <div key={m.label} className="bg-surface border border-[rgba(255,255,255,.07)] rounded-xl p-5">
            <p className="text-muted text-xs mb-1">{m.label}</p>
            <p className="text-2xl font-bold">{m.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Velocity chart */}
      {data?.velocity?.length > 0 && (
        <div className="bg-surface border border-[rgba(255,255,255,.07)] rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-sm mb-4">Sprint Velocity (tasks completed / day)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.velocity}>
              <defs>
                <linearGradient id="vel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,.07)', borderRadius: 8, fontSize: 12 }}
                cursor={{ stroke: '#6c63ff', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="count" stroke="#6c63ff" fill="url(#vel)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {data && (
        <div className="bg-surface border border-[rgba(255,255,255,.07)] rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-1">AI Productivity Insight</h2>
          <p className="text-muted text-sm mt-2">
            {data.completion_rate >= 70
              ? '✅ Great velocity! Your team is completing tasks consistently.'
              : data.completion_rate >= 40
              ? '⚠️ Moderate progress. Consider reviewing overdue tasks and blockers.'
              : '🔴 Low completion rate. Run an AI sprint planner to re-prioritise work.'}
          </p>
        </div>
      )}
    </div>
  )
}
