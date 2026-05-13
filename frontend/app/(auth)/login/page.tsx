'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const router  = useRouter()
  const setAuth = useAuthStore(s => s.setAuth)
  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', form)
      setAuth(data.access_token, data.refresh_token)
      router.replace('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface border border-[rgba(255,255,255,.07)] rounded-xl p-8">
      <div className="text-center mb-8">
        <div className="text-3xl mb-2">🚀</div>
        <h1 className="text-xl font-bold">TaskFlow AI</h1>
        <p className="text-muted text-sm mt-1">Sign in to your workspace</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs text-muted mb-1.5">Email</label>
          <input
            type="email" required
            className="w-full bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">Password</label>
          <input
            type="password" required
            className="w-full bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full bg-accent hover:bg-[#5a52e0] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div className="mt-4 text-center text-xs text-muted">
        <Link href="/forgot-password" className="hover:text-text">Forgot password?</Link>
        <span className="mx-2">·</span>
        <Link href="/register" className="hover:text-text">Create account</Link>
      </div>
    </div>
  )
}
