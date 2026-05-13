'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useBoardStore } from '@/store/boardStore'
import { api } from '@/lib/api'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']

interface Props { task: any; onClose: () => void }

export default function TaskModal({ task, onClose }: Props) {
  const updateTask = useBoardStore(s => s.updateTask)
  const deleteTask = useBoardStore(s => s.deleteTask)

  const [title, setTitle]       = useState(task.title)
  const [desc, setDesc]         = useState(task.description ?? '')
  const [priority, setPriority] = useState(task.priority)
  const [saving, setSaving]     = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setComment] = useState('')
  const [tab, setTab]           = useState<'details' | 'comments'>('details')

  const loadComments = async () => {
    const { data } = await api.get(`/api/tasks/${task.id}/comments`)
    setComments(data)
  }

  const saveTask = async () => {
    setSaving(true)
    try {
      await updateTask(task.id, { title, description: desc, priority })
      toast.success('Task saved')
      onClose()
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return
    await deleteTask(task.id, task.column_id)
    onClose()
  }

  const postComment = async () => {
    if (!newComment.trim()) return
    await api.post(`/api/tasks/${task.id}/comments`, { content: newComment })
    setComment('')
    loadComments()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-surface border border-[rgba(255,255,255,.07)] rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,.07)]">
          <div className="flex gap-2">
            {(['details', 'comments'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); if (t === 'comments') loadComments() }}
                className={`text-sm px-3 py-1 rounded capitalize ${tab === t ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-muted hover:text-text text-lg">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'details' ? (
            <>
              <div>
                <label className="text-xs text-muted block mb-1">Title</label>
                <input
                  className="w-full bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Description</label>
                <textarea
                  rows={4}
                  className="w-full bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2 text-sm outline-none focus:border-accent resize-none"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Priority</label>
                <div className="flex gap-2 flex-wrap">
                  {PRIORITIES.map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`text-xs px-3 py-1.5 rounded capitalize border transition-colors ${
                        priority === p
                          ? 'bg-accent text-white border-accent'
                          : 'border-[rgba(255,255,255,.07)] text-muted hover:text-text'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {task.due_date && (
                <p className="text-xs text-muted">Due: {format(new Date(task.due_date), 'PPP')}</p>
              )}
              {task.github_pr_url && (
                <a href={task.github_pr_url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline block">
                  🔗 GitHub PR ({task.github_pr_status})
                </a>
              )}
            </>
          ) : (
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="bg-s2 rounded-lg p-3">
                  <p className="text-xs font-semibold text-accent mb-1">User</p>
                  <p className="text-sm">{c.content}</p>
                  <p className="text-[10px] text-muted mt-1">{format(new Date(c.created_at), 'PPp')}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                  placeholder="Add a comment…"
                  value={newComment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && postComment()}
                />
                <button onClick={postComment} className="bg-accent text-white text-sm px-3 rounded-lg">Post</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === 'details' && (
          <div className="px-5 py-3 border-t border-[rgba(255,255,255,.07)] flex justify-between">
            <button onClick={handleDelete} className="text-xs text-red hover:text-red/70">Delete task</button>
            <div className="flex gap-2">
              <button onClick={onClose} className="text-xs text-muted px-3 py-1.5">Cancel</button>
              <button
                onClick={saveTask} disabled={saving}
                className="text-xs bg-accent text-white px-4 py-1.5 rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
