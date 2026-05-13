import { create } from 'zustand'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Task {
  id: string; column_id: string; title: string; description?: string
  priority: string; labels?: string; due_date?: string; assignee_id?: string
  github_pr_url?: string; github_pr_status?: string; ai_generated?: boolean
  position: number; created_at: string; updated_at: string
}

interface Column { id: string; name: string; position: number; color?: string; wip_limit?: number; tasks: Task[] }
interface Board   { id: string; name: string; github_repo?: string }

interface BoardState {
  board:   Board | null
  columns: Column[]
  loadBoard:  (id: string) => Promise<void>
  createTask: (columnId: string, title: string, extras?: Partial<Task>) => Promise<void>
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>
  deleteTask: (taskId: string, columnId: string) => Promise<void>
  moveTask:   (taskId: string, toColumnId: string, toPos?: number) => Promise<void>
  applyWSEvent: (event: any) => void
}

interface SocketState {
  onlineUsers: string[]
  setOnlineUsers: (users: string[]) => void
}

export const useSocketStore = create<SocketState>(set => ({
  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),
}))

export const useBoardStore = create<BoardState>((set, get) => ({
  board:   null,
  columns: [],

  loadBoard: async (id) => {
    try {
      const { data } = await api.get(`/api/boards/${id}/full`)
      set({ board: { id: data.id, name: data.name, github_repo: data.github_repo }, columns: data.columns ?? [] })
    } catch { toast.error('Failed to load board') }
  },

  createTask: async (columnId, title, extras = {}) => {
    try {
      const { data } = await api.post(`/api/tasks/column/${columnId}`, {
        title, priority: extras.priority ?? 'medium', ...extras,
      })
      set(s => ({
        columns: s.columns.map(c =>
          c.id === columnId ? { ...c, tasks: [...c.tasks, data] } : c
        ),
      }))
    } catch { toast.error('Failed to create task') }
  },

  updateTask: async (taskId, updates) => {
    const { data } = await api.patch(`/api/tasks/${taskId}`, updates)
    set(s => ({
      columns: s.columns.map(c => ({
        ...c,
        tasks: c.tasks.map(t => t.id === taskId ? { ...t, ...data } : t),
      })),
    }))
  },

  deleteTask: async (taskId, columnId) => {
    await api.delete(`/api/tasks/${taskId}`)
    set(s => ({
      columns: s.columns.map(c =>
        c.id === columnId ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) } : c
      ),
    }))
  },

  moveTask: async (taskId, toColumnId, toPos) => {
    // Optimistic update
    let task: Task | undefined
    set(s => {
      const newCols = s.columns.map(c => ({ ...c, tasks: c.tasks.filter(t => {
        if (t.id === taskId) { task = t; return false } return true
      }) }))
      if (!task) return { columns: newCols }
      const updated = { ...task, column_id: toColumnId }
      return {
        columns: newCols.map(c =>
          c.id === toColumnId
            ? { ...c, tasks: toPos !== undefined
                ? [...c.tasks.slice(0, toPos), updated, ...c.tasks.slice(toPos)]
                : [...c.tasks, updated]
              }
            : c
        ),
      }
    })
    try {
      await api.patch(`/api/tasks/${taskId}`, { column_id: toColumnId, position: toPos ?? 0 })
    } catch { toast.error('Failed to move task'); get().loadBoard(get().board?.id ?? '') }
  },

  applyWSEvent: (event) => {
    if (event.type === 'presence') {
      useSocketStore.getState().setOnlineUsers(event.online ?? [])
    } else if (event.type === 'task_created') {
      // Re-fetch is simplest to stay in sync
      get().loadBoard(get().board?.id ?? '')
    } else if (event.type === 'task_updated') {
      get().loadBoard(get().board?.id ?? '')
    }
  },
}))
