import { useEffect, useRef } from 'react'
import { connectSocket, disconnectSocket, onMessage } from '@/lib/socket'
import { useAuthStore }  from '@/store/authStore'
import { useBoardStore } from '@/store/boardStore'

export function useSocket(boardId: string) {
  const token      = useAuthStore(s => s.token)
  const applyEvent = useBoardStore(s => s.applyWSEvent)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!boardId || !token) return
    connectSocket(boardId, token)
    cleanupRef.current = onMessage(applyEvent)
    return () => {
      cleanupRef.current?.()
      disconnectSocket()
    }
  }, [boardId, token])
}
