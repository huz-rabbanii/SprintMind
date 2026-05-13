'use client'
import { useSocketStore } from '@/store/boardStore'

interface Props { boardId: string }

const COLORS = ['#6c63ff','#00d4ff','#22c55e','#eab308','#ef4444','#f97316']

export default function PresenceBar({ boardId }: Props) {
  const onlineUsers = useSocketStore(s => s.onlineUsers)

  if (!onlineUsers.length) return null

  return (
    <div className="flex items-center gap-1" title={`${onlineUsers.length} online`}>
      {onlineUsers.slice(0, 5).map((uid, i) => (
        <div
          key={uid}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-bg"
          style={{ background: COLORS[i % COLORS.length] }}
          title={uid}
        >
          {uid.slice(0, 2).toUpperCase()}
        </div>
      ))}
      {onlineUsers.length > 5 && (
        <span className="text-xs text-muted ml-1">+{onlineUsers.length - 5}</span>
      )}
    </div>
  )
}
