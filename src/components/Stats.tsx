"use client";

import { usePomodoroStore } from "@/store/pomodoro";
import { motion } from "framer-motion";
import { Clock, ListChecks, Sparkles } from "lucide-react";

export default function Stats() {
  const { getTodayStats, getWeekData, logs } = usePomodoroStore();
  const todayStats = getTodayStats();
  const weekData = getWeekData();

  const todayCompletedTasks = logs.filter(
    (l) => l.date === new Date().toISOString().slice(0, 10) && l.type === "focus"
  ).length;

  return (
    <div className="glass rounded-3xl p-5 w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-[#FF6B6B]" />
        <h3 className="font-semibold text-sm">今日概览</h3>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-3 text-center"
        >
          <div className="text-2xl font-bold tabular-nums" style={{ color: "#FF6B6B" }}>
            {todayStats.focusCount}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 flex items-center justify-center gap-1">
            🍅 番茄
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-3 text-center"
        >
          <div className="text-2xl font-bold tabular-nums" style={{ color: "#4ECDC4" }}>
            {todayStats.focusMinutes}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 flex items-center justify-center gap-1">
            <Clock size={10} /> 分钟
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-3 text-center"
        >
          <div className="text-2xl font-bold tabular-nums" style={{ color: "#45B7D1" }}>
            {todayCompletedTasks}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 flex items-center justify-center gap-1">
            <ListChecks size={10} /> 完成
          </div>
        </motion.div>
      </div>

      {/* 7-day mini chart */}
      <div>
        <h4 className="text-xs text-[var(--text-secondary)] mb-3 font-medium">近 7 天专注趋势</h4>
        <div className="flex items-end gap-1.5 h-20">
          {weekData.map((day, i) => {
            const max = Math.max(...weekData.map((d) => d.focusCount), 1);
            const height = Math.max((day.focusCount / max) * 100, day.focusCount > 0 ? 8 : 0);
            const dayLabel = ["日", "一", "二", "三", "四", "五", "六"][new Date(day.date).getDay()];

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.05 }}
                  className="w-full rounded-lg transition-all duration-300"
                  style={{
                    background: day.focusCount > 0
                      ? "linear-gradient(180deg, #FF6B6B, #FF8E53)"
                      : "var(--glass-bg)",
                    opacity: day.focusCount > 0 ? 0.8 : 0.3,
                    minHeight: day.focusCount > 0 ? 4 : 0,
                  }}
                />
                <span className="text-[9px] text-[var(--text-secondary)]">{dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
