'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

export default function Topbar() {
  const user = useAuthStore(s => s.user)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.get('/api/notifications/?unread_only=true')
      .then(r => setUnread(r.data.length))
      .catch(() => {})
  }, [])

  return (
    <header className="h-14 px-6 border-b border-[rgba(255,255,255,.07)] flex items-center justify-end gap-4 bg-surface shrink-0">
      {/* Notifications */}
      <button className="relative text-muted hover:text-text transition-colors">
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red text-white text-[9px] rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* User */}
      {user && (
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
            {user.full_name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className="text-muted hidden sm:block">{user.full_name}</span>
        </div>
      )}
    </header>
  )
}
