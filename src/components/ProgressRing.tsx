"use client";

import { type TimerMode } from "@/store/pomodoro";
import { motion } from "framer-motion";

interface ProgressRingProps {
  progress: number; // 0–1
  size?: number;
  strokeWidth?: number;
  mode: TimerMode;
}

const MODE_COLORS: Record<TimerMode, string> = {
  focus:      "#FF6B6B",
  shortBreak: "#4ECDC4",
  longBreak:  "#45B7D1",
};

const MODE_GRADIENTS: Record<TimerMode, { from: string; to: string }> = {
  focus:      { from: "#FF6B6B", to: "#FF8E53" },
  shortBreak: { from: "#4ECDC4", to: "#45B7D1" },
  longBreak:  { from: "#45B7D1", to: "#6C5CE7" },
};

export default function ProgressRing({
  progress,
  size = 280,
  strokeWidth = 6,
  mode,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));
  const center = size / 2;
  const grad = MODE_GRADIENTS[mode];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={`ring-grad-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={grad.from} />
            <stop offset="100%" stopColor={grad.to} />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="opacity-10"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#ring-grad-${mode})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ ease: "linear", duration: 0.3 }}
          style={{ strokeDashoffset: circumference }}
        />
      </svg>

      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full opacity-20 blur-xl transition-all duration-500"
        style={{
          background: `radial-gradient(circle, ${grad.from}33 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}
