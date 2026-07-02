"use client";

import { usePomodoroStore, type ThemeMode } from "@/store/pomodoro";
import { Moon, Sun, Monitor } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, setTheme } = usePomodoroStore();

  const themes: { key: ThemeMode; icon: typeof Sun; label: string }[] = [
    { key: "light", icon: Sun, label: "浅色" },
    { key: "dark", icon: Moon, label: "深色" },
    { key: "system", icon: Monitor, label: "系统" },
  ];

  return (
    <div className="glass rounded-full p-1 flex gap-1">
      {themes.map(({ key, icon: Icon, label }) => (
        <motion.button
          key={key}
          whileTap={{ scale: 0.9 }}
          onClick={() => setTheme(key)}
          className={`
            relative p-2 rounded-full transition-colors cursor-pointer
            ${theme === key
              ? "text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }
          `}
          aria-label={label}
          title={label}
        >
          {theme === key && (
            <motion.div
              layoutId="theme-bg"
              className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53]"
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            />
          )}
          <Icon size={14} className="relative z-10" />
        </motion.button>
      ))}
    </div>
  );
}
