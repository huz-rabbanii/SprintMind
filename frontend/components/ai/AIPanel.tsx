'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useBoardStore } from '@/store/boardStore'

interface Props { boardId: string }

export default function AIPanel({ boardId }: Props) {
  const [open, setOpen]     = useState(false)
  const [tab, setTab]       = useState<'breakdown' | 'nlp' | 'sprint'>('breakdown')
  const [input, setInput]   = useState('')
  const [days, setDays]     = useState(30)
  const [team, setTeam]     = useState(3)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const createTask = useBoardStore(s => s.createTask)
  const columns    = useBoardStore(s => s.columns)

  const run = async () => {
    if (!input.trim()) return
    setLoading(true); setResult(null)
    try {
      if (tab === 'breakdown') {
        const { data } = await api.post('/api/ai/breakdown', { goal: input })
        setResult(data)
      } else if (tab === 'nlp') {
        const { data } = await api.post('/api/ai/parse-task', { text: input })
        setResult(data)
      } else {
        const { data } = await api.post('/api/ai/sprint-plan', { goal: input, deadline_days: days, team_size: team })
        setResult(data)
      }
    } catch { toast.error('AI request failed') }
    finally { setLoading(false) }
  }

  const addBreakdownToBoard = async () => {
    if (!result?.subtasks) return
    const todoCol = columns.find(c => c.name.toLowerCase() === 'todo') ?? columns[0]
    if (!todoCol) return
    for (const st of result.subtasks) {
      await createTask(todoCol.id, st.title, { priority: st.priority, ai_generated: true })
    }
    toast.success(`${result.subtasks.length} tasks added to board!`)
    setOpen(false)
  }

  const addNLPTask = async () => {
    const todoCol = columns.find(c => c.name.toLowerCase() === 'todo') ?? columns[0]
    if (!todoCol || !result) return
    await createTask(todoCol.id, result.title, { priority: result.priority, ai_generated: true })
    toast.success('Task added!')
    setOpen(false)
  }

  const addSprintToBoard = async () => {
    if (!result?.milestones) return
    const todoCol = columns.find(c => c.name.toLowerCase() === 'todo') ?? columns[0]
    if (!todoCol) return
    let count = 0
    for (const milestone of result.milestones) {
      for (const task of milestone.tasks) {
        await createTask(todoCol.id, task, { ai_generated: true })
        count++
      }
    }
    toast.success(`${count} sprint tasks added to board!`)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
      >
        ✨ AI
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-surface border border-[rgba(255,255,255,.07)] rounded-xl w-full max-w-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,.07)]">
              <h2 className="font-bold">✨ AI Assistant</h2>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-text text-lg">×</button>
            </div>

            <div className="flex gap-1 px-5 pt-4">
              {(['breakdown', 'nlp', 'sprint'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setResult(null) }}
                  className={`text-xs px-3 py-1.5 rounded capitalize ${tab === t ? 'bg-accent text-white' : 'text-muted bg-s2 hover:text-text'}`}
                >
                  {t === 'breakdown' ? 'Task Breakdown' : t === 'nlp' ? 'Natural Language' : 'Sprint Planner'}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1.5">
                  {tab === 'breakdown' ? 'Describe your goal or feature…'
                    : tab === 'nlp' ? 'Describe the task in plain English…'
                    : 'What is the MVP goal?'}
                </label>
                <textarea
                  rows={3}
                  className="w-full bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2 text-sm outline-none focus:border-accent resize-none"
                  placeholder={
                    tab === 'breakdown' ? 'e.g. Build a payment gateway with Stripe'
                      : tab === 'nlp'   ? 'e.g. Finish Docker deployment by Friday, assign to Huzaifa'
                      : 'e.g. Launch MVP of the SaaS platform'
                  }
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
              </div>

              {tab === 'sprint' && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-muted block mb-1">Deadline (days)</label>
                    <input type="number" min={1} className="w-full bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                      value={days} onChange={e => setDays(+e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted block mb-1">Team size</label>
                    <input type="number" min={1} className="w-full bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                      value={team} onChange={e => setTeam(+e.target.value)} />
                  </div>
                </div>
              )}

              <button
                onClick={run} disabled={loading || !input.trim()}
                className="w-full bg-accent hover:bg-[#5a52e0] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Thinking…' : '✨ Generate'}
              </button>

              {/* Results */}
              {result && tab === 'breakdown' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">
                      {result.subtasks.length} tasks · {result.total_estimated_hours}h · complexity: <span className="text-accent">{result.complexity}</span>
                    </p>
                    <button onClick={addBreakdownToBoard} className="text-xs bg-green/10 text-green border border-green/20 px-3 py-1 rounded">
                      + Add all to board
                    </button>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {result.subtasks.map((st: any, i: number) => (
                      <div key={i} className="bg-s2 rounded-lg p-3 text-sm">
                        <p className="font-medium">{st.title}</p>
                        {st.description && <p className="text-muted text-xs mt-0.5">{st.description}</p>}
                        <p className="text-[10px] text-muted mt-1">{st.priority} · {st.estimated_hours}h</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result && tab === 'nlp' && (
                <div className="bg-s2 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold">{result.title}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-accent/10 text-accent px-2 py-0.5 rounded">{result.priority}</span>
                    {result.due_date && <span className="text-muted">Due: {result.due_date}</span>}
                    {result.assignee_name && <span className="text-muted">Assign: {result.assignee_name}</span>}
                    {result.labels?.map((l: string) => <span key={l} className="bg-s2 border border-[rgba(255,255,255,.07)] px-2 py-0.5 rounded">{l}</span>)}
                  </div>
                  <button onClick={addNLPTask} className="text-xs bg-green/10 text-green border border-green/20 px-3 py-1 rounded mt-1">
                    + Add to board
                  </button>
                </div>
              )}

              {result && tab === 'sprint' && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">
                      {result.total_tasks} tasks · risk: <span className="text-accent">{result.risk_level}</span>
                    </p>
                    <button onClick={addSprintToBoard} className="text-xs bg-green/10 text-green border border-green/20 px-3 py-1 rounded">
                      + Add all to board
                    </button>
                  </div>
                  {result.milestones.map((m: any) => (
                    <div key={m.week} className="bg-s2 rounded-lg p-3">
                      <p className="text-sm font-semibold text-accent">Week {m.week}: {m.title}</p>
                      <ul className="mt-2 space-y-1">
                        {m.tasks.map((t: string, i: number) => (
                          <li key={i} className="text-xs text-muted flex gap-2"><span>→</span>{t}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
