import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import { useBoardStore } from '@/store/boardStore'
import TaskCard  from './TaskCard'
import TaskModal from './TaskModal'

interface ColData { id: string; name: string; color?: string; wip_limit?: number; tasks: any[] }
interface Props   { column: ColData }

export default function Column({ column }: Props) {
  const [adding, setAdding]     = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [modalTask, setModal]   = useState<any>(null)
  const createTask = useBoardStore(s => s.createTask)

  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'column' } })

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    await createTask(column.id, newTitle.trim())
    setNewTitle(''); setAdding(false)
  }

  const overLimit = column.wip_limit && column.tasks.length >= column.wip_limit

  return (
    <>
      {modalTask && <TaskModal task={modalTask} onClose={() => setModal(null)} />}

      <div
        ref={setNodeRef}
        className={`flex flex-col w-72 shrink-0 bg-surface rounded-xl border transition-colors ${
          isOver ? 'border-accent/60' : 'border-[rgba(255,255,255,.07)]'
        }`}
      >
        {/* Column header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,.07)]">
          <div className="flex items-center gap-2">
            {column.color && (
              <span className="w-2 h-2 rounded-full" style={{ background: column.color }} />
            )}
            <span className="font-semibold text-sm">{column.name}</span>
            <span className="text-xs text-muted bg-s2 px-1.5 py-0.5 rounded">{column.tasks.length}</span>
          </div>
          {overLimit && (
            <span className="text-xs text-yellow" title="WIP limit reached">⚠</span>
          )}
        </div>

        {/* Tasks */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2 min-h-[4rem]">
          <SortableContext items={column.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {column.tasks.map(task => (
              <TaskCard key={task.id} task={task} columnId={column.id} onClick={() => setModal(task)} />
            ))}
          </SortableContext>
        </div>

        {/* Add task */}
        <div className="px-2 pb-2">
          {adding ? (
            <div className="bg-s2 rounded-lg p-2 space-y-2">
              <input
                autoFocus
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                placeholder="Task title…"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')  handleAdd()
                  if (e.key === 'Escape') setAdding(false)
                }}
              />
              <div className="flex gap-2">
                <button onClick={handleAdd} className="text-xs bg-accent text-white px-3 py-1 rounded">Add</button>
                <button onClick={() => setAdding(false)} className="text-xs text-muted">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full text-left text-xs text-muted hover:text-text px-2 py-1.5 rounded hover:bg-s2 transition-colors"
            >
              + Add task
            </button>
          )}
        </div>
      </div>
    </>
  )
}
