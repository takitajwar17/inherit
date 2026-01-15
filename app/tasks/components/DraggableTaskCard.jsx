"use client";

/**
 * DraggableTaskCard Component
 * 
 * Task card with drag-and-drop support for rescheduling using Framer Motion
 */

import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import TaskCard from "./TaskCard";
import { useState } from "react";

export default function DraggableTaskCard({ 
  task, 
  onToggleComplete, 
  onEdit, 
  onDelete,
  onDragEnd 
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event, info) => {
        setIsDragging(false);
        
        // Calculate direction and distance
        const threshold = 50;
        if (Math.abs(info.offset.y) > threshold) {
          const direction = info.offset.y > 0 ? "down" : "up";
          onDragEnd && onDragEnd(task, direction, info.offset.y);
        }
      }}
      className="relative group cursor-grab active:cursor-grabbing"
      whileDrag={{ scale: 1.02, opacity: 0.8, zIndex: 50 }}
    >
      {/* Drag Handle */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
        <GripVertical className="w-5 h-5 text-gray-500" />
      </div>

      {/* Task Card */}
      <div className={isDragging ? "ring-2 ring-violet-500 rounded-lg" : ""}>
        <TaskCard
          task={task}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </motion.div>
  );
}

