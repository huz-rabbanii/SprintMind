'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function SettingsPage() {
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const saveProfile = async () => {
    if (!fullName.trim() || !username.trim()) {
      toast.error('Name and username are required')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.patch('/api/auth/me', { full_name: fullName, username })
      setUser(data)
      toast.success('Profile updated')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setChangingPassword(true)
    try {
      await api.post('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-muted text-sm mb-8">Manage your account preferences</p>

      {/* Profile Section */}
      <section className="bg-surface border border-[rgba(255,255,255,.07)] rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1.5">Email</label>
            <input
              type="email"
              disabled
              value={user?.email ?? ''}
              className="w-full bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2.5 text-sm outline-none opacity-60 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
              placeholder="username"
            />
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="bg-accent hover:bg-[#5a52e0] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>

      {/* Password Section */}
      <section className="bg-surface border border-[rgba(255,255,255,.07)] rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={changePassword}
            disabled={changingPassword}
            className="bg-accent hover:bg-[#5a52e0] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-surface border border-red-500/30 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-muted text-sm mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold px-4 py-2.5 rounded-lg border border-red-500/30 transition-colors"
        >
          Delete Account
        </button>
      </section>
    </div>
  )
}
