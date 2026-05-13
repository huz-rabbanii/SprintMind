'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

interface Board { id: string; name: string; description: string; github_repo: string | null }

export default function WorkspacePage() {
  const { id }   = useParams<{ id: string }>()
  const [boards, setBoards]       = useState<Board[]>([])
  const [workspace, setWorkspace] = useState<any>(null)
  const [newName, setNewName]     = useState('')
  const [creating, setCreating]   = useState(false)

  useEffect(() => {
    api.get(`/api/workspaces/${id}`).then(r => setWorkspace(r.data))
    api.get(`/api/boards/workspace/${id}`).then(r => setBoards(r.data))
  }, [id])

  const createBoard = async () => {
    if (!newName.trim()) return
    try {
      const { data } = await api.post(`/api/boards/workspace/${id}`, { name: newName })
      setBoards(b => [data, ...b])
      setNewName(''); setCreating(false)
      toast.success('Board created')
    } catch { toast.error('Failed to create board') }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-muted text-xs mb-1"><Link href="/dashboard" className="hover:text-text">Workspaces</Link> /</p>
          <h1 className="text-2xl font-bold">{workspace?.name ?? '…'}</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-accent hover:bg-[#5a52e0] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New Board
        </button>
      </div>

      {creating && (
        <div className="bg-surface border border-[rgba(255,255,255,.07)] rounded-xl p-5 mb-6 flex gap-3">
          <input
            autoFocus
            className="flex-1 bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Board name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createBoard()}
          />
          <button onClick={createBoard} className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold">Create</button>
          <button onClick={() => setCreating(false)} className="text-muted text-sm px-3">Cancel</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {boards.map(b => (
          <Link
            key={b.id}
            href={`/board/${b.id}`}
            className="bg-surface border border-[rgba(255,255,255,.07)] rounded-xl p-5 hover:border-accent/40 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-semibold group-hover:text-accent transition-colors">{b.name}</h3>
              {b.github_repo && <span className="text-xs text-muted bg-s2 px-2 py-0.5 rounded">GitHub</span>}
            </div>
            <p className="text-muted text-xs mt-2">{b.description || 'No description'}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
