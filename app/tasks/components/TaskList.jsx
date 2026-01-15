"use client";

/**
 * TaskList Component
 * 
 * Groups and displays tasks based on current view
 */

import { AnimatePresence } from "framer-motion";
import TaskCard from "./TaskCard";
import { Calendar, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableTaskItem({ task, ...props }) {
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
    zIndex: isDragging ? 1 : 0,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} {...props} />
    </div>
  );
}

export default function TaskList({
  tasks,
  currentView,
  onToggleComplete,
  onEdit,
  onDelete,
  onReorder,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter tasks based on current view
  const filterTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    switch (currentView) {
      case "inbox":
        return tasks.filter(t => t.status !== "completed" && !t.category);
      
      case "today":
        return tasks.filter(t => {
          if (t.status === "completed") return false;
          if (!t.dueDate) {
            // Show tasks without due dates in "today" view
            return true;
          }
          const dueDate = new Date(t.dueDate);
          const dueDateStr = dueDate.toDateString();
          const todayStr = today.toDateString();
          return dueDateStr === todayStr;
        });
      
      case "upcoming":
        return tasks.filter(t => {
          if (t.status === "completed") return false;
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate >= tomorrow && dueDate < nextWeek;
        });
      
      case "overdue":
        return tasks.filter(t => {
          if (t.status === "completed") return false;
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate < today;
        });
      
      case "p1":
        return tasks.filter(t => t.status !== "completed" && t.priority === "high");
      
      case "p2":
        return tasks.filter(t => t.status !== "completed" && t.priority === "medium");
      
      case "p3":
        return tasks.filter(t => t.status !== "completed" && t.priority === "low");
      
      case "completed":
        return tasks.filter(t => t.status === "completed");
      
      case "all":
        return tasks;
      
      default:
        // Category views
        if (currentView && currentView.startsWith("category:")) {
          const category = currentView.split(":")[1];
          return tasks.filter(t => t.status !== "completed" && t.category === category);
        }
        return tasks.filter(t => t.status !== "completed");
    }
  };

  // Group tasks by date for upcoming view
  const groupTasksByDate = (taskList) => {
    const groups = {};
    
    taskList.forEach(task => {
      if (!task.dueDate) {
        if (!groups["No date"]) groups["No date"] = [];
        groups["No date"].push(task);
        return;
      }

      const dateStr = new Date(task.dueDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(task);
    });

    return groups;
  };

  const getViewTitle = () => {
    const titles = {
      inbox: "Inbox",
      today: "Today",
      upcoming: "Upcoming",
      overdue: "Overdue",
      completed: "Completed",
      all: "All Tasks",
      p1: "Priority 1",
      p2: "Priority 2",
      p3: "Priority 3",
    };

    if (currentView && currentView.startsWith("category:")) {
      const category = currentView.split(":")[1];
      return category.charAt(0).toUpperCase() + category.slice(1);
    }

    return titles[currentView] || "All Tasks";
  };

  const getViewDescription = () => {
    const descriptions = {
      inbox: "Tasks without a category",
      today: "Tasks due today",
      upcoming: "Tasks due in the next 7 days",
      overdue: "Tasks that are past their due date",
      completed: "All completed tasks",
      all: "All your tasks",
      p1: "High priority tasks",
      p2: "Medium priority tasks",
      p3: "Low priority tasks",
    };

    if (currentView && currentView.startsWith("category:")) {
      const category = currentView.split(":")[1];
      return `All ${category} tasks`;
    }

    return descriptions[currentView] || "All your tasks";
  };

  const filteredTasks = filterTasks();
  const isGrouped = currentView === "upcoming";
  const groupedTasks = isGrouped ? groupTasksByDate(filteredTasks) : null;

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = filteredTasks.findIndex((t) => t._id === active.id);
      const newIndex = filteredTasks.findIndex((t) => t._id === over.id);
      
      const newFilteredOrder = arrayMove(filteredTasks, oldIndex, newIndex);
      
      // We need to map this back to the global 'tasks' list if we want to persist correctly
      // But since we are passing 'onReorder', let's construct the full new list.
      // This is tricky because we are only viewing a subset.
      // Strategy: Reorder the subset, then merge back into the main list?
      // Or just reorder the subset and assume the backend handles partial updates?
      // Our backend reorder accepts a list of {id, order}. We can just send the subset reordered.
      // BUT, the 'order' index should be global.
      // If we just swap orders of two items, it's safer.
      
      // Let's create a new full list for the optimistic update
      const newTasks = [...tasks];
      const activeTaskGlobalIndex = tasks.findIndex(t => t._id === active.id);
      const overTaskGlobalIndex = tasks.findIndex(t => t._id === over.id);

      // Simple swap in global list? No, that might not be what visually happened if list is filtered.
      // Visually we moved item A to position of item B in the FILTERED list.
      // Effectively we want A to have an order index "between" its new neighbors.
      // This is hard with integer orders.
      
      // Simplified approach: Reorder the whole 'tasks' array to match the visual change?
      // Or just trigger onReorder with the reordered filtered list and let the parent handle it.
      // But parent expects 'tasks' (all tasks).
      
      // Best approach for now:
      // Since we can't easily reorder a subset within a superset without gaps,
      // let's just do a local swap in the full list of the two items involved? No.
      
      // Let's assume onReorder expects the FULL list.
      // We construct a new full list where the moved item is placed before/after the target in the full list?
      
      // Let's try to just reorder the subset and pass that back.
      // If the parent simply replaces 'tasks' with this subset, we lose data.
      // The parent implementation of handleReorder: setTasks(reorderedTasks). 
      // So we MUST return the full list.
      
      // Logic:
      // 1. Remove active item from global list.
      // 2. Find the global index of the 'over' item.
      // 3. Insert active item at that index.
      
      const activeItem = tasks.find(t => t._id === active.id);
      let newGlobalList = tasks.filter(t => t._id !== active.id);
      const overGlobalIndex = newGlobalList.findIndex(t => t._id === over.id);
      
      // If dragging downwards, we insert after? No, arrayMove logic usually implies "insert at index".
      // But we need to know if we dropped "above" or "below".
      // arrayMove does this based on indices.
      
      // Let's rely on arrayMove on the FILTERED list to get the relative order.
      // Then reconstruct the global list maintaining that relative order?
      // That's too complex.
      
      // Alternative: Just re-assign 'order' property to all items in the filtered list based on their new visual position.
      // Then merge these updates into the global list.
      
      // 1. Get new order of filtered items
      const newFilteredTasks = arrayMove(filteredTasks, oldIndex, newIndex);
      
      // 2. Create a map of id -> new relative index (or just use their existing order values and swap them?)
      // Swapping values is safer if we want to preserve gaps.
      // Let's just re-assign order 0, 1, 2... to the filtered list items? 
      // That might conflict with hidden items.
      
      // Let's just perform the move in the global list relative to the over item.
      // If dragging A onto B.
      // Find index of B in global list. Insert A there.
      
      const newGlobalTasks = [...tasks];
      const globalOldIndex = newGlobalTasks.findIndex(t => t._id === active.id);
      // Remove it
      const [movedItem] = newGlobalTasks.splice(globalOldIndex, 1);
      
      // Find where to put it
      // We know it should be near 'over' item.
      // If newIndex > oldIndex (moved down), it should be after 'over'.
      // If newIndex < oldIndex (moved up), it should be before 'over'.
      let globalNewIndex = newGlobalTasks.findIndex(t => t._id === over.id);
      
      if (oldIndex < newIndex) {
         // Moved down in filtered list. In global list, we want it AFTER the over item?
         // arrayMove(items, 0, 1) -> [B, A]. A moves to index 1.
         // If we insert at globalNewIndex + 1?
         globalNewIndex += 1;
      }
      
      newGlobalTasks.splice(globalNewIndex, 0, movedItem);
      
      // Re-normalize order field?
      // onReorder expects the new list.
      onReorder(newGlobalTasks);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <SectionHeader
        title={getViewTitle()}
        subtitle={getViewDescription()}
      />
      
      {filteredTasks.length > 0 && (
        <div className="text-sm text-gray-600">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tasks here
            </h3>
            <p className="text-sm text-gray-600 max-w-sm">
              {currentView === "today" 
                ? "You're all caught up for today! 🎉"
                : "Create a task to get started"}
            </p>
          </div>
        </Card>
      ) : isGrouped && groupedTasks ? (
        // Grouped by date (Upcoming view) - No DnD for now
        <div className="space-y-8">
          {Object.entries(groupedTasks).map(([date, dateTasks]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  {date}
                </h3>
                <span className="text-xs text-gray-500">
                  ({dateTasks.length})
                </span>
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {dateTasks.map(task => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onToggleComplete={onToggleComplete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Simple list - With DnD
        <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext 
                items={filteredTasks.map(t => t._id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredTasks.map(task => (
                      <SortableTaskItem
                        key={task._id}
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </AnimatePresence>
                </div>
            </SortableContext>
        </DndContext>
      )}
    </div>
  );
}