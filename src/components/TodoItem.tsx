"use client";

import { useRef, useState } from "react";
import {
  usePomodoroStore,
  TODO_GROUP_LABEL,
  TODO_GROUP_EMOJI,
  type TodoGroup,
  type Todo,
} from "@/store/pomodoro";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";

interface TodoItemProps {
  todo: Todo;
}

const GROUP_ORDER: TodoGroup[] = ["today", "week", "longterm"];

const GROUP_COLORS: Record<TodoGroup, string> = {
  today: "#FF6B6B",
  week: "#4ECDC4",
  longterm: "#45B7D1",
};

export default function TodoItem({ todo }: TodoItemProps) {
  const { toggleTodo, deleteTodo, setActiveTodo, activeTodoId, changeTodoGroup } = usePomodoroStore();
  const itemRef = useRef<HTMLDivElement>(null);
  const [showGroupMenu, setShowGroupMenu] = useState(false);

  const isActive = activeTodoId === todo.id;
  const isDone = todo.completed;

  const handleToggle = () => {
    toggleTodo(todo.id);
    if (!todo.completed && itemRef.current) {
      itemRef.current.classList.remove("task-glow");
      void itemRef.current.offsetWidth;
      itemRef.current.classList.add("task-glow");
    }
  };

  const handleGroupChange = (g: TodoGroup) => {
    changeTodoGroup(todo.id, g);
    setShowGroupMenu(false);
  };

  const nextGroup = GROUP_ORDER[(GROUP_ORDER.indexOf(todo.group) + 1) % GROUP_ORDER.length];

  return (
    <motion.div
      ref={itemRef}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onClick={() => !isDone && setActiveTodo(isActive ? null : todo.id)}
      className={`
        group relative flex items-center gap-2.5 px-3 py-2.5 rounded-2xl cursor-pointer
        transition-all duration-200
        ${isActive
          ? "bg-gradient-to-r from-[#FF6B6B]/10 to-[#FF8E53]/10 ring-1 ring-[#FF6B6B]/30"
          : "hover:bg-white/20 dark:hover:bg-white/5"
        }
        ${isDone ? "opacity-60" : ""}
      `}
    >
      {/* Group color dot */}
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: GROUP_COLORS[todo.group] }}
        title={TODO_GROUP_LABEL[todo.group]}
      />

      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
        className={`
          w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 cursor-pointer
          ${isDone
            ? "bg-gradient-to-br from-[#4ECDC4] to-[#45B7D1] border-transparent"
            : "border-[var(--text-secondary)] hover:border-[#FF6B6B]"
          }
        `}
      >
        {isDone && (
          <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Text */}
      <span
        className={`flex-1 text-sm transition-all duration-200 ${
          isDone ? "line-through text-[var(--text-secondary)]" : ""
        }`}
      >
        {todo.text}
      </span>

      {/* Group badge (click to cycle) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleGroupChange(nextGroup);
        }}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/10 cursor-pointer flex-shrink-0"
        style={{ color: GROUP_COLORS[todo.group] }}
        title={`点击切换到 ${TODO_GROUP_LABEL[nextGroup]}`}
      >
        {TODO_GROUP_EMOJI[todo.group]}
        {TODO_GROUP_LABEL[todo.group]}
        <ArrowRight size={10} />
      </button>

      {/* Pomodoro count */}
      {todo.pomodoros > 0 && (
        <span className="text-xs text-[var(--text-secondary)] flex-shrink-0" title="专注次数">
          🍅 {todo.pomodoros}
        </span>
      )}

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-white/10 text-[var(--text-secondary)] hover:text-red-400 cursor-pointer flex-shrink-0"
        aria-label="删除任务"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
