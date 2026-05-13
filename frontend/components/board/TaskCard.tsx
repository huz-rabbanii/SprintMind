import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { format } from 'date-fns'

const PRIORITY_COLORS: Record<string, string> = {
  low:    'bg-green/10 text-green',
  medium: 'bg-yellow/10 text-yellow',
  high:   'bg-orange-500/10 text-orange-400',
  urgent: 'bg-red/10 text-red',
}

interface Task {
  id: string; title: string; description?: string; priority: string;
  due_date?: string; assignee_id?: string; labels?: string;
  github_pr_url?: string; github_pr_status?: string; ai_generated?: boolean
}

interface Props {
  task: Task
  columnId?: string
  overlay?: boolean
  onClick?: () => void
}

export default function TaskCard({ task, columnId, overlay, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: 'task', task, columnId, position: 0 } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const labels: string[] = task.labels ? JSON.parse(task.labels) : []

  return (
    <div
      ref={setNodeRef}
      style={overlay ? {} : style}
      {...(!overlay ? attributes : {})}
      {...(!overlay ? listeners : {})}
      onClick={onClick}
      className={clsx(
        'bg-s2 border border-[rgba(255,255,255,.07)] rounded-lg p-3 cursor-pointer select-none',
        'hover:border-accent/40 transition-colors group',
        overlay && 'rotate-2 shadow-xl',
      )}
    >
      {/* Priority + AI badge */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded', PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium)}>
          {task.priority?.toUpperCase()}
        </span>
        {task.ai_generated && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">AI</span>
        )}
        {task.github_pr_url && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-s2 border border-[rgba(255,255,255,.07)] text-muted">
            PR: {task.github_pr_status ?? 'open'}
          </span>
        )}
      </div>

      <p className="text-sm font-medium leading-snug">{task.title}</p>

      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {labels.map(l => (
            <span key={l} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">{l}</span>
          ))}
        </div>
      )}

      {task.due_date && (
        <p className="text-[10px] text-muted mt-2">
          📅 {format(new Date(task.due_date), 'MMM d')}
        </p>
      )}
    </div>
  )
}
