import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'TaskFlow AI — Collaborative Kanban',
  description: 'AI-powered collaborative Kanban with real-time collaboration and GitHub integration.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#16161f', color: '#e2e8f0', border: '1px solid rgba(255,255,255,.07)' },
          }}
        />
      </body>
    </html>
  )
}
