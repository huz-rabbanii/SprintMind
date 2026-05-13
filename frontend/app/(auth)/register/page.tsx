'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm]     = useState({ email: '', username: '', full_name: '', password: '' })
  const [loading, setLoading] = useState(false)

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value })),
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/auth/register', form)
      toast.success('Account created! Check your email to verify.')
      router.replace('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface border border-[rgba(255,255,255,.07)] rounded-xl p-8">
      <div className="text-center mb-8">
        <div className="text-3xl mb-2">🚀</div>
        <h1 className="text-xl font-bold">Create Account</h1>
        <p className="text-muted text-sm mt-1">Start collaborating with your team</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {([
          ['full_name', 'Full Name',  'text',     'Jane Doe'],
          ['username',  'Username',   'text',     'janedoe'],
          ['email',     'Email',      'email',    'jane@example.com'],
          ['password',  'Password',   'password', ''],
        ] as const).map(([key, label, type, placeholder]) => (
          <div key={key}>
            <label className="block text-xs text-muted mb-1.5">{label}</label>
            <input
              type={type} required placeholder={placeholder}
              className="w-full bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
              {...field(key as keyof typeof form)}
            />
          </div>
        ))}
        <button
          type="submit" disabled={loading}
          className="w-full bg-accent hover:bg-[#5a52e0] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted">
        Already have an account? <Link href="/login" className="text-accent hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
