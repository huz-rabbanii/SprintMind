'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface Workspace { id: string; name: string; slug: string; icon: string; description: string }

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [creating, setCreating]     = useState(false)
  const [newName, setNewName]       = useState('')

  const load = async () => {
    try {
      const { data } = await api.get('/api/workspaces/')
      setWorkspaces(data)
    } catch { /* handled by api interceptor */ }
  }

  useEffect(() => { load() }, [])

  const createWorkspace = async () => {
    if (!newName.trim()) return
    try {
      const { data } = await api.post('/api/workspaces/', { name: newName })
      setWorkspaces(w => [data, ...w])
      setNewName('')
      setCreating(false)
      toast.success('Workspace created')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to create workspace')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.full_name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-muted text-sm mt-1">Select a workspace to get started.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-accent hover:bg-[#5a52e0] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New Workspace
        </button>
      </div>

      {creating && (
        <div className="bg-surface border border-[rgba(255,255,255,.07)] rounded-xl p-5 mb-6 flex gap-3">
          <input
            autoFocus
            className="flex-1 bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Workspace name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createWorkspace()}
          />
          <button onClick={createWorkspace} className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold">Create</button>
          <button onClick={() => setCreating(false)} className="text-muted text-sm px-3">Cancel</button>
        </div>
      )}

      {workspaces.length === 0 ? (
        <div className="text-center py-24 text-muted">
          <div className="text-4xl mb-3">🗂️</div>
          <p>No workspaces yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map(ws => (
            <Link
              key={ws.id}
              href={`/workspace/${ws.id}`}
              className="bg-surface border border-[rgba(255,255,255,.07)] rounded-xl p-5 hover:border-accent/40 transition-colors group"
            >
              <div className="text-3xl mb-3">{ws.icon ?? '🚀'}</div>
              <h3 className="font-semibold group-hover:text-accent transition-colors">{ws.name}</h3>
              <p className="text-muted text-xs mt-1 line-clamp-2">{ws.description || 'No description'}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
