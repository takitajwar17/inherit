"use client";

/**
 * TaskBoard Component
 *
 * A futuristic Kanban board with glass columns and fluid drag-and-drop.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
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
      className={`w-80 flex flex-col h-full ${column.bgColor} ${column.borderColor} ${
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
}) {
  const [activeId, setActiveId] = useState(null);
  const activeTask = useMemo(() => {
    return tasks.find(task => task._id === activeId);
  }, [activeId, tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
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
        tasks: tasks.filter(
          (t) => !t.status || t.status === "pending" || (t.status !== "completed" && t.status !== "in_progress")
        ),
      },
      {
        id: "in_progress",
        title: "In Progress",
        color: "bg-purple-500",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        tasks: tasks.filter((t) => t.status === "in_progress"),
      },
      {
        id: "completed",
        title: "Completed",
        color: "bg-green-500",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        tasks: tasks.filter((t) => t.status === "completed"),
      },
    ];
  }, [tasks]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find which column the task is being dropped into
    let newStatus = null;
    if (overId === "pending") {
      newStatus = "pending";
    } else if (overId === "in_progress") {
      newStatus = "in_progress";
    } else if (overId === "completed") {
      newStatus = "completed";
    }

    if (newStatus && onUpdateTaskStatus) {
      onUpdateTaskStatus(activeId, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 min-w-max h-full">
          {columns.map((column) => (
            <div
              key={column.id}
              data-column={column.id}
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

          {/* Add Column Button (Visual only for now) */}
          <Card className="w-12 h-full border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-500 cursor-pointer">
            <Plus size={24} />
            <span className="vertical-text text-xs uppercase tracking-widest font-semibold opacity-60">
              Add Section
            </span>
          </Card>
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
