let socket: WebSocket | null = null
let boardId: string | null = null

type Handler = (data: any) => void
const handlers: Set<Handler> = new Set()

export function connectSocket(bid: string, token: string) {
  if (socket && boardId === bid) return
  if (socket) socket.close()

  boardId = bid
  const wsBase = typeof window !== 'undefined'
    ? window.location.origin.replace(/^http/, 'ws')
    : 'ws://localhost:8000'
  socket = new WebSocket(`${wsBase}/api/ws/board/${bid}?token=${token}`)

  socket.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)
      handlers.forEach(h => h(data))
    } catch { /* ignore */ }
  }

  socket.onclose = () => { socket = null }
}

export function disconnectSocket() {
  socket?.close()
  socket = null
}

export function onMessage(handler: Handler) {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

export function sendMessage(data: object) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data))
  }
}
