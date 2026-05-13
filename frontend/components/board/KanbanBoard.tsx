'use client'
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay,
  PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useBoardStore } from '@/store/boardStore'
import Column  from './Column'
import TaskCard from './TaskCard'
import { useState } from 'react'

interface Props { boardId: string }

export default function KanbanBoard({ boardId }: Props) {
  const columns    = useBoardStore(s => s.columns)
  const moveTask   = useBoardStore(s => s.moveTask)
  const [activeTask, setActiveTask] = useState<any>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const onDragStart = (event: any) => {
    if (event.active.data.current?.type === 'task') {
      setActiveTask(event.active.data.current.task)
    }
  }

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type
    const overType   = over.data.current?.type

    if (activeType === 'task') {
      const taskId   = active.id as string
      const toColId  = overType === 'column' ? (over.id as string) : over.data.current?.columnId
      const toPos    = overType === 'task'   ? over.data.current?.position : undefined
      if (toColId) moveTask(taskId, toColId, toPos)
    }
  }

  if (!columns.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted text-sm">
        Loading board…
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 p-6 h-full items-start">
        <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          {columns.map(col => (
            <Column key={col.id} column={col} />
          ))}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
