"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  usePomodoroStore,
  completeFocusSession,
  completeBreakSession,
  MODE_CONFIG,
  type TimerMode,
} from "@/store/pomodoro";
import ProgressRing from "./ProgressRing";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Timer() {
  const {
    mode, seconds, totalSeconds, isRunning,
    start, pause, reset, skip, tick,
  } = usePomodoroStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSecondRef = useRef(seconds);
  const [popKey, setPopKey] = useState(0);

  const config = MODE_CONFIG[mode];
  const progress = totalSeconds > 0 ? seconds / totalSeconds : 0;
  const isFocus = mode === "focus";

  // Sound alarm using Web Audio API
  const playAlarm = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = isFocus ? [523.25, 659.25, 783.99] : [783.99, 659.25, 523.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.45);
      });
    } catch { /* silent */ }
  }, [isFocus]);

  // Desktop notification
  const sendNotification = useCallback((title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }, []);

  // Haptic feedback (mobile)
  const haptic = useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const currentSeconds = usePomodoroStore.getState().seconds;
        if (currentSeconds <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          usePomodoroStore.setState({ isRunning: false, seconds: 0 });

          playAlarm();
          haptic();

          const { mode: currentMode } = usePomodoroStore.getState();
          if (currentMode === "focus") {
            sendNotification("🍅 番茄完成！", "太棒了！该休息一下了～");
            completeFocusSession();
          } else {
            sendNotification("☕ 休息结束", "休息好了吗？开始新的番茄吧！");
            completeBreakSession();
          }
        } else {
          tick();
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, playAlarm, sendNotification, haptic, tick]);

  // Digit pop animation
  useEffect(() => {
    if (seconds !== prevSecondRef.current) {
      prevSecondRef.current = seconds;
      setPopKey((k) => k + 1);
    }
  }, [seconds]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Theme color meta tag
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const colors: Record<TimerMode, string> = {
      focus: "#FF6B6B",
      shortBreak: "#4ECDC4",
      longBreak: "#45B7D1",
    };
    meta.setAttribute("content", colors[mode]);
  }, [mode]);

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const activeTodo = usePomodoroStore((s) =>
    s.activeTodoId ? s.todos.find((t) => t.id === s.activeTodoId) : null
  );

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Phase name */}
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <span className="text-4xl">{config.emoji}</span>
        <h2
          className="text-lg font-semibold mt-1 transition-colors"
          style={{ color: isFocus ? "#FF6B6B" : "#4ECDC4" }}
        >
          {config.label}
        </h2>
        {activeTodo && (
          <p className="text-sm text-[var(--text-secondary)] mt-1 truncate max-w-[240px]">
            🎯 {activeTodo.text}
          </p>
        )}
      </motion.div>

      {/* Ring + Display */}
      <div className="relative flex items-center justify-center">
        <ProgressRing progress={progress} mode={mode} size={260} strokeWidth={5} />

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={popKey}
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 12 }}
            className="font-mono text-6xl sm:text-7xl font-light tracking-[4px] tabular-nums"
          >
            {fmt(seconds)}
          </motion.div>
          <span className="text-xs text-[var(--text-secondary)] mt-1 font-medium tracking-widest uppercase">
            {isRunning ? "进行中" : seconds === 0 ? "已完成" : "已暂停"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-5">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={reset}
          className="w-12 h-12 rounded-full flex items-center justify-center glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          aria-label="重置"
          title="重置 (R)"
        >
          <RotateCcw size={20} />
        </motion.button>

        <motion.button
          id="main-timer-btn"
          whileTap={{ scale: 0.92 }}
          onClick={() => (isRunning ? pause() : start())}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer",
            isFocus
              ? "bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white shadow-[#FF6B6B]/30"
              : "bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] text-white shadow-[#4ECDC4]/30"
          )}
          aria-label={isRunning ? "暂停" : "开始"}
          title={isRunning ? "暂停 (Space)" : "开始 (Space)"}
        >
          {isRunning ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" />}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={skip}
          className="w-12 h-12 rounded-full flex items-center justify-center glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          aria-label="跳过"
          title="跳过"
        >
          <SkipForward size={20} />
        </motion.button>
      </div>
    </div>
  );
}
