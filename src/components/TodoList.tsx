"use client";

import { useState } from "react";
import {
  usePomodoroStore,
  TODO_GROUP_LABEL,
  TODO_GROUP_EMOJI,
  type TodoGroup,
} from "@/store/pomodoro";
import TodoItem from "./TodoItem";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const GROUPS: TodoGroup[] = ["today", "week", "longterm"];

export default function TodoList() {
  const { todos, addTodo, todoGroupFilter, setTodoGroupFilter } = usePomodoroStore();
  const [input, setInput] = useState("");
  const [showDone, setShowDone] = useState(false);

  // Filter tasks by selected group
  const filteredTodos = todos.filter((t) => t.group === todoGroupFilter);
  const activeTodos = filteredTodos.filter((t) => !t.completed);
  const doneTodos = filteredTodos.filter((t) => t.completed);

  // Counts per group
  const countByGroup = (g: TodoGroup) => todos.filter((t) => t.group === g && !t.completed).length;

  const handleAdd = () => {
    addTodo(input, todoGroupFilter);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  return (
    <div className="glass rounded-3xl p-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          📋 任务清单
          <span className="text-xs text-[var(--text-secondary)] font-normal">
            {todos.filter((t) => !t.completed).length}/{todos.length}
          </span>
        </h3>
      </div>

      {/* Group Tabs */}
      <div className="flex gap-1.5 mb-4">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setTodoGroupFilter(g)}
            className={`
              relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium
              transition-all duration-200 cursor-pointer
              ${todoGroupFilter === g
                ? "text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10"
              }
            `}
          >
            {todoGroupFilter === g && (
              <motion.div
                layoutId="todo-tab-bg"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53]"
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              />
            )}
            <span className="relative z-10">{TODO_GROUP_EMOJI[g]}</span>
            <span className="relative z-10">{TODO_GROUP_LABEL[g]}</span>
            {countByGroup(g) > 0 && (
              <span
                className={`
                  relative z-10 text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                  ${todoGroupFilter === g
                    ? "bg-white/25 text-white"
                    : "bg-[var(--glass-bg)] text-[var(--text-secondary)]"
                  }
                `}
              >
                {countByGroup(g)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`在「${TODO_GROUP_LABEL[todoGroupFilter]}」中添加任务...`}
          maxLength={120}
          className="flex-1 bg-white/30 dark:bg-white/5 rounded-xl px-4 py-2.5 text-sm outline-none border border-white/20 focus:border-[#FF6B6B]/50 transition-colors placeholder:text-[var(--text-secondary)]"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleAdd}
          disabled={!input.trim()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white text-sm font-medium disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-opacity flex items-center gap-1"
        >
          <Plus size={16} />
          添加
        </motion.button>
      </div>

      {/* Active Todos */}
      <AnimatePresence mode="popLayout">
        {activeTodos.length === 0 && doneTodos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-[var(--text-secondary)]"
          >
            <span className="text-3xl block mb-2">
              {todoGroupFilter === "today" ? "🌟✨" : todoGroupFilter === "week" ? "📅✨" : "🗃️✨"}
            </span>
            <p className="text-sm">
              {todoGroupFilter === "today"
                ? "今天还没有任务，加一个吧！"
                : todoGroupFilter === "week"
                ? "本周还没有任务，规划一下吧！"
                : "暂无长期任务"}
            </p>
          </motion.div>
        )}

        {activeTodos.length > 0 && (
          <div className="space-y-1 mb-3">
            {activeTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Completed toggle */}
      {doneTodos.length > 0 && (
        <>
          <button
            onClick={() => setShowDone(!showDone)}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-2 cursor-pointer"
          >
            {showDone ? "▾ 隐藏已完成" : `▸ 已完成 (${doneTodos.length})`}
          </button>
          <AnimatePresence>
            {showDone && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-1"
              >
                {doneTodos.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
