'use client'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import KanbanBoard   from '@/components/board/KanbanBoard'
import PresenceBar   from '@/components/realtime/PresenceBar'
import AIPanel       from '@/components/ai/AIPanel'
import { useBoardStore } from '@/store/boardStore'
import { useSocket }    from '@/hooks/useSocket'

export default function BoardPage() {
  const { id } = useParams<{ id: string }>()
  const loadBoard = useBoardStore(s => s.loadBoard)
  const board     = useBoardStore(s => s.board)

  useSocket(id)

  useEffect(() => { loadBoard(id) }, [id])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,.07)] flex-shrink-0">
        <div>
          <h1 className="font-bold text-lg">{board?.name ?? '…'}</h1>
          {board?.github_repo && (
            <span className="text-xs text-muted">🔗 {board.github_repo}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <PresenceBar boardId={id} />
          <AIPanel boardId={id} />
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto">
        <KanbanBoard boardId={id} />
      </div>
    </div>
  )
}
