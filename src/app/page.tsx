"use client";

import { useEffect } from "react";
import { usePomodoroStore } from "@/store/pomodoro";
import Timer from "@/components/Timer";
import TodoList from "@/components/TodoList";
import Stats from "@/components/Stats";
import ThemeToggle from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, ListTodo } from "lucide-react";
import { useState } from "react";

type TabView = "todo" | "stats";

export default function Home() {
  const { theme, setTheme } = usePomodoroStore();
  const [mobileTab, setMobileTab] = useState<TabView>("todo");
  const [mounted, setMounted] = useState(false);

  // Apply theme class
  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // System
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      root.classList.toggle("dark", mq.matches);
      const handler = (e: MediaQueryListEvent) => root.classList.toggle("dark", e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " || e.key === "Space") {
        e.preventDefault();
        document.getElementById("main-timer-btn")?.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 transition-all duration-500">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <span className="text-2xl">🍅</span>
          <h1 className="text-lg font-bold tracking-tight">
            元气番茄时钟
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <ThemeToggle />
        </motion.div>
      </header>

      {/* Main content */}
      <main className="w-full max-w-4xl flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
        {/* Left: Todo (desktop) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0 w-full"
        >
          <TodoList />
        </motion.div>

        {/* Center: Timer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex-1 flex flex-col items-center"
        >
          <div className="glass rounded-[2rem] p-6 sm:p-8 w-full max-w-md mx-auto">
            <Timer />
          </div>

          {/* Mobile Tab Bar (iOS-style) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-4 py-2 z-50">
            <div className="flex items-center justify-center gap-8 max-w-md mx-auto">
              <button
                onClick={() => setMobileTab("todo")}
                className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-colors cursor-pointer ${
                  mobileTab === "todo"
                    ? "text-[#FF6B6B]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                <ListTodo size={20} />
                <span className="text-[10px] font-medium">任务</span>
              </button>
              <button
                onClick={() => setMobileTab("stats")}
                className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-colors cursor-pointer ${
                  mobileTab === "stats"
                    ? "text-[#FF6B6B]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                <BarChart3 size={20} />
                <span className="text-[10px] font-medium">统计</span>
              </button>
            </div>
          </div>

          {/* Mobile panels */}
          <AnimatePresence mode="wait">
            {mobileTab === "todo" && (
              <motion.div
                key="mobile-todo"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="lg:hidden w-full mt-4 mb-20"
              >
                <TodoList />
              </motion.div>
            )}
            {mobileTab === "stats" && (
              <motion.div
                key="mobile-stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="lg:hidden w-full mt-4 mb-20"
              >
                <Stats />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right: Stats (desktop) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0 w-full"
        >
          <Stats />
        </motion.div>
      </main>

      {/* Desktop bottom padding */}
      <div className="hidden lg:block h-4" />
    </div>
  );
}
