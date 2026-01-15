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
  onUpdateTask,
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
          if (!t.dueDate) return true; // Show no-date in Today? Maybe. Or strict today. Todoist shows no-date in Inbox.
          // Let's stick to strict Today filtering if selected, but since we're grouping, 
          // maybe we relax this if the user asks for "Today" view specifically?
          // Actually, if View is "Today", we ONLY want Today tasks. 
          // So the grouping will result in just one group "Today" (and maybe "Overdue").
          const dueDate = new Date(t.dueDate);
          const dueDateStr = dueDate.toDateString();
          const todayStr = today.toDateString();
          return dueDateStr === todayStr;
        });
      
      case "upcoming":
        return tasks.filter(t => {
          if (t.status === "completed") return false;
          if (!t.dueDate) return false;
          // Upcoming usually implies future.
          const dueDate = new Date(t.dueDate);
          return dueDate >= today; // Include today?
        });
      
      case "overdue":
        return tasks.filter(t => {
          if (t.status === "completed") return false;
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate < today;
        });
        
      case "completed":
        return tasks.filter(t => t.status === "completed");
      
      case "all":
        return tasks; // Show everything, grouped.
      
      default:
        if (currentView && currentView.startsWith("category:")) {
          const category = currentView.split(":")[1];
          return tasks.filter(t => t.status !== "completed" && t.category === category);
        }
        // Priority views
        if (["p1", "p2", "p3"].includes(currentView)) {
             const priorityMap = { p1: 'high', p2: 'medium', p3: 'low' };
             return tasks.filter(t => t.status !== "completed" && t.priority === priorityMap[currentView]);
        }
        return tasks.filter(t => t.status !== "completed");
    }
  };

  const filteredTasks = filterTasks();

  const groupTasks = (taskList) => {
    const groups = {
      overdue: { id: "overdue", title: "Overdue", tasks: [], date: null }, // Date update logic handled separately
      today: { id: "today", title: "Today", tasks: [], date: new Date() },
      tomorrow: { id: "tomorrow", title: "Tomorrow", tasks: [], date: new Date(new Date().setDate(new Date().getDate() + 1)) },
      upcoming: { id: "upcoming", title: "Next 7 Days", tasks: [], date: null },
      later: { id: "later", title: "Later", tasks: [], date: null },
      noDate: { id: "noDate", title: "No Date", tasks: [], date: null }
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    taskList.forEach(task => {
      if (task.status === "completed") {
          // You might want a "Completed" group if viewing All
          // But usually Completed view is separate. 
          // If View is "All", let's put completed in a "Completed" group?
          // For now, let's ignore completed in grouping if they were filtered out, 
          // but if they are present, we need a group.
          if (!groups.completed) groups.completed = { id: "completed", title: "Completed", tasks: [] };
          groups.completed.tasks.push(task);
          return;
      }

      if (!task.dueDate) {
        groups.noDate.tasks.push(task);
        return;
      }

      const date = new Date(task.dueDate);
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (dateOnly < today) {
        groups.overdue.tasks.push(task);
      } else if (dateOnly.getTime() === today.getTime()) {
        groups.today.tasks.push(task);
      } else if (dateOnly.getTime() === tomorrow.getTime()) {
        groups.tomorrow.tasks.push(task);
      } else if (dateOnly < nextWeek) {
        groups.upcoming.tasks.push(task);
      } else {
        groups.later.tasks.push(task);
      }
    });

    return Object.values(groups).filter(g => g.tasks.length > 0);
  };

  const groupedTasks = groupTasks(filteredTasks);

  const getViewTitle = () => {
    // ... existing logic ...
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
     // ... existing logic ...
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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(t => t._id === active.id);
    if (!activeTask) return;

    // Find source and destination groups
    // We can't rely on 'items' of SortableContext directly in dragEnd?
    // We can infer group from the container id if we set it on Droppable, 
    // OR we can infer from the task's properties vs the group it landed in.
    // DndKit `over.id` is usually the draggable item id if dropping on an item, 
    // or container id if dropping on container.
    // If we drop on an item, we need to find that item's group.
    
    // Helper to find group of a task
    const findGroupOfTask = (taskId) => groupedTasks.find(g => g.tasks.some(t => t._id === taskId));
    const findGroupById = (groupId) => groupedTasks.find(g => g.id === groupId);

    const sourceGroup = findGroupOfTask(active.id);
    let destGroup;
    
    // Check if dropped on a container (group) or an item
    if (findGroupById(over.id)) {
        destGroup = findGroupById(over.id);
    } else {
        destGroup = findGroupOfTask(over.id);
    }

    if (!sourceGroup || !destGroup) return;

    // Same group -> Reorder
    if (sourceGroup.id === destGroup.id) {
        if (active.id !== over.id) {
            const oldIndex = tasks.findIndex(t => t._id === active.id);
            const newIndex = tasks.findIndex(t => t._id === over.id);
            // This global reorder works because we are swapping positions in the master list
            // effectively.
            // Wait, if I use `tasks` (all tasks), finding index of `over.id` is correct.
            // BUT `arrayMove` on `tasks` might move it far away if `tasks` is not sorted by the group.
            // However, we want to update the order.
            
            // Visual reorder in the group:
            const groupTasksList = sourceGroup.tasks;
            const oldGroupIndex = groupTasksList.findIndex(t => t._id === active.id);
            const newGroupIndex = groupTasksList.findIndex(t => t._id === over.id);
            
            const newGroupOrder = arrayMove(groupTasksList, oldGroupIndex, newGroupIndex);
            
            // Optimistic update?
            // Actually, we should just call onReorder with a "smart" reordered list.
            // Smart reorder:
            // We want 'active' to take the 'order' of 'over' (roughly).
            // Swap orders?
            // If we just tell the parent "Here is the new tasks list", we need to construct it.
            
            // Simpler: Just swap the two items in the global tasks array and send that?
            // That works for a Swap.
            
            // But dragging implies insert.
            // Let's try to map the new group order to global updates.
            // We can just send the updated group tasks to the backend if the backend supports it.
            // But onReorder expects all tasks.
            
            // Fallback: Just Swap. It's stable.
            const newTasks = [...tasks];
            const t1 = newTasks[oldIndex];
            const t2 = newTasks[newIndex];
            // Actually swapping indices in the array is `arrayMove`.
            const movedTasks = arrayMove(newTasks, oldIndex, newIndex);
            onReorder(movedTasks);
        }
    } else {
        // Different group -> Update Date (if applicable)
        if (destGroup.id === "today") {
            onUpdateTask(active.id, { dueDate: new Date() });
        } else if (destGroup.id === "tomorrow") {
            const tmr = new Date();
            tmr.setDate(tmr.getDate() + 1);
            onUpdateTask(active.id, { dueDate: tmr });
        } else if (destGroup.id === "noDate") {
            onUpdateTask(active.id, { dueDate: null });
        } else if (destGroup.id === "overdue") {
             // Dragging to overdue... set to yesterday?
             const yest = new Date();
             yest.setDate(yest.getDate() - 1);
             onUpdateTask(active.id, { dueDate: yest });
        }
        // "upcoming", "later", "completed" - complex, ignore for now or handle specifically
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title={getViewTitle()}
        subtitle={getViewDescription()}
      />
      
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
      ) : (
        <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-8">
                {groupedTasks.map(group => (
                    <div key={group.id}>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                            <h3 className={`text-sm font-semibold ${
                                group.id === 'overdue' ? 'text-red-600' : 
                                group.id === 'today' ? 'text-green-600' : 'text-gray-700'
                            }`}>
                                {group.title}
                            </h3>
                            <span className="text-xs text-gray-400 font-medium">
                                {group.tasks.length}
                            </span>
                        </div>
                        
                        <SortableContext 
                            items={group.tasks.map(t => t._id)}
                            strategy={verticalListSortingStrategy}
                            id={group.id} // Important for distinguishing context
                        >
                            <div className="space-y-3">
                                {group.tasks.map(task => (
                                    <SortableTaskItem
                                        key={task._id}
                                        task={task}
                                        onToggleComplete={onToggleComplete}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </div>
                ))}
            </div>
        </DndContext>
      )}
    </div>
  );
}