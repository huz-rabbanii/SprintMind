import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User { id: string; email: string; full_name: string; username: string; avatar_url?: string }
interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  setAuth: (token: string, refresh: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, refreshToken) => set({ token, refreshToken }),
      setUser: (user) => set({ user }),
      logout: () => {
        set({ token: null, refreshToken: null, user: null })
        if (typeof window !== 'undefined') window.location.href = '/login'
      },
    }),
    { name: 'auth-storage' }
  )
)
