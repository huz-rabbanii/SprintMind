'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/layout/Sidebar'
import Topbar  from '@/components/layout/Topbar'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const router       = useRouter()
  const token        = useAuthStore(s => s.token)
  const hasHydrated  = useAuthStore(s => s._hasHydrated)

  useEffect(() => {
    if (hasHydrated && !token) router.replace('/login')
  }, [token, hasHydrated, router])

  if (!hasHydrated) return null
  if (!token) return null

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
