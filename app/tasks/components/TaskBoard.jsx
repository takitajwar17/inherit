"use client";

/**
 * TaskBoard Component
 *
 * A futuristic Kanban board with glass columns and fluid drag-and-drop.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import TaskCard from "./TaskCard";
import { Plus, GripVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Draggable Task Card Component
function DraggableTaskCard({ task, onToggleComplete, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({ column, children }) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <Card 
      ref={setNodeRef}
      className={`w-full flex flex-col h-full ${column.bgColor} ${column.borderColor} ${
        isOver ? 'ring-2 ring-primary ring-opacity-50' : ''
      }`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white/50">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${column.color}`} />
          <h3 className="font-semibold text-gray-900 tracking-wide">
            {column.title}
          </h3>
          <span className="text-xs text-gray-600 bg-white/80 px-2 py-0.5 rounded-full border border-gray-200">
            {column.tasks.length}
          </span>
        </div>
        <Button
          onClick={() => {}}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {children}
      </div>
    </Card>
  );
}

export default function TaskBoard({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onQuickAdd,
  onUpdateTaskStatus,
  onReorder,
}) {
  const [tasksState, setTasksState] = useState(tasks);
  const [activeId, setActiveId] = useState(null);

  // Sync internal state with props
  useEffect(() => {
    setTasksState(tasks);
  }, [tasks]);

  const activeTask = useMemo(() => {
    return tasksState.find(task => task._id === activeId);
  }, [activeId, tasksState]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by status/priority for the board
  const columns = useMemo(() => {
    return [
      {
        id: "pending",
        title: "To Do",
        color: "bg-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        tasks: tasksState.filter(
          (t) => !t.status || t.status === "pending" || (t.status !== "completed" && t.status !== "in_progress")
        ),
      },
      {
        id: "in_progress",
        title: "In Progress",
        color: "bg-purple-500",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        tasks: tasksState.filter((t) => t.status === "in_progress"),
      },
      {
        id: "completed",
        title: "Completed",
        color: "bg-green-500",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        tasks: tasksState.filter((t) => t.status === "completed"),
      },
    ];
  }, [tasksState]);

  const findContainer = (id) => {
    if (["pending", "in_progress", "completed"].includes(id)) {
      return id;
    }
    const task = tasksState.find(t => t._id === id);
    if (task) {
        if (task.status === "in_progress") return "in_progress";
        if (task.status === "completed") return "completed";
        return "pending";
    }
    return null;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the containers
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }

    setTasksState((prev) => {
      const activeItems = prev.filter(t => findContainer(t._id) === activeContainer);
      const overItems = prev.filter(t => findContainer(t._id) === overContainer);
      
      const activeIndex = activeItems.findIndex((t) => t._id === activeId);
      const overIndex = overItems.findIndex((t) => t._id === overId);

      let newIndex;
      if (overId === overContainer) {
        // We're over the column container itself
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top >
            over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      return prev.map(t => {
        if (t._id === activeId) {
            return { ...t, status: overContainer };
        }
        return t;
      });
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const activeId = active.id;
    const overId = over.id;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (
        activeContainer &&
        overContainer &&
        activeContainer !== overContainer
    ) {
        // Visual state is already updated by DragOver, just fire the API/Parent update
        if (onUpdateTaskStatus) {
            onUpdateTaskStatus(activeId, overContainer);
        }
    } else if (activeContainer === overContainer && activeId !== overId) {
        // Reordering within the same column
        const oldIndex = tasksState.findIndex((t) => t._id === activeId);
        const newIndex = tasksState.findIndex((t) => t._id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
            const newTasks = arrayMove(tasksState, oldIndex, newIndex);
            setTasksState(newTasks);
            if (onReorder) {
                onReorder(newTasks);
            }
        }
    }

    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 h-full">
        <div className="flex gap-6 h-full">
          {columns.map((column) => (
            <div
              key={column.id}
              data-column={column.id}
              className="flex-1 min-w-0"
            >
              <DroppableColumn column={column}>
                <SortableContext
                  items={column.tasks.map(t => t._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence mode="popLayout">
                    {column.tasks.map((task) => (
                      <DraggableTaskCard
                        key={task._id}
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </AnimatePresence>
                </SortableContext>

                {column.tasks.length === 0 && (
                  <div 
                    className="h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-500 text-sm italic"
                    data-column={column.id}
                  >
                    Drop tasks here
                  </div>
                )}
              </DroppableColumn>
            </div>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            onToggleComplete={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
