'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import clsx from 'clsx'

const NAV = [
  { href: '/dashboard',   icon: '🏠', label: 'Workspaces' },
  { href: '/analytics',   icon: '📊', label: 'Analytics'  },
  { href: '/settings',    icon: '⚙️',  label: 'Settings'   },
]

export default function Sidebar() {
  const pathname = usePathname()
  const logout   = useAuthStore(s => s.logout)

  return (
    <aside className="w-56 shrink-0 bg-surface border-r border-[rgba(255,255,255,.07)] flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-[rgba(255,255,255,.07)]">
        <span className="text-xl">🚀</span>
        <span className="font-bold text-sm">TaskFlow AI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-accent/10 text-accent font-medium'
                : 'text-muted hover:text-text hover:bg-s2',
            )}
          >
            <span>{icon}</span>{label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-2.5 px-5 py-4 text-sm text-muted hover:text-text border-t border-[rgba(255,255,255,.07)] transition-colors"
      >
        <span>🚪</span> Sign out
      </button>
    </aside>
  )
}
