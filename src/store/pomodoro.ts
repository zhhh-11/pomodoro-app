"use client";

import { create } from "zustand";

/* ─── Type Definitions ─────────────────────────────────────── */

export type TodoGroup = "today" | "week" | "longterm";

export const TODO_GROUP_LABEL: Record<TodoGroup, string> = {
  today: "本日",
  week: "本周",
  longterm: "长期",
};

export const TODO_GROUP_EMOJI: Record<TodoGroup, string> = {
  today: "🌟",
  week: "📅",
  longterm: "🗃️",
};

export interface Todo {
  id: string;
  text: string;
  group: TodoGroup;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  pomodoros: number;
}

export interface PomodoroLog {
  id: string;
  date: string; // YYYY-MM-DD
  duration: number;
  todoId?: string;
  type: "focus" | "shortBreak" | "longBreak";
}

export type TimerMode = "focus" | "shortBreak" | "longBreak";
export type ThemeMode = "light" | "dark" | "system";

export interface DailyStats {
  date: string; // YYYY-MM-DD
  focusCount: number;
  focusMinutes: number;
  completedTasks: number;
}

/* ─── Config ────────────────────────────────────────────────── */

export const MODE_CONFIG: Record<TimerMode, { label: string; defaultMin: number; emoji: string }> = {
  focus:      { label: "专注时间",    defaultMin: 25, emoji: "🍅" },
  shortBreak: { label: "小憩一下",    defaultMin: 5,  emoji: "☕" },
  longBreak:  { label: "长休时间",    defaultMin: 15, emoji: "🛌" },
};

export const MODE_CYCLE: TimerMode[] = [
  "focus", "shortBreak", "focus", "shortBreak",
  "focus", "shortBreak", "focus", "longBreak",
];

/* ─── Helpers ───────────────────────────────────────────────── */

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/* ─── Store Interface ──────────────────────────────────────── */

export interface PomodoroStore {
  // Timer
  mode: TimerMode;
  modeIndex: number; // index into MODE_CYCLE
  seconds: number;
  totalSeconds: number;
  isRunning: boolean;

  // Settings
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;

  // Theme
  theme: ThemeMode;

  // Todos
  todos: Todo[];
  activeTodoId: string | null;
  todoGroupFilter: TodoGroup;

  // Logs & Stats
  logs: PomodoroLog[];
  dailyStats: Record<string, DailyStats>;

  // History panel visibility
  showHistory: boolean;

  // Actions
  tick: () => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  setMode: (mode: TimerMode) => void;
  setTheme: (theme: ThemeMode) => void;
  setFocusMinutes: (m: number) => void;
  setShortBreakMinutes: (m: number) => void;
  setLongBreakMinutes: (m: number) => void;
  setShowHistory: (v: boolean) => void;

  addTodo: (text: string, group?: TodoGroup) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  setActiveTodo: (id: string | null) => void;
  incrementTodoPomodoro: (id: string) => void;
  changeTodoGroup: (id: string, group: TodoGroup) => void;
  setTodoGroupFilter: (group: TodoGroup) => void;

  getTodayStats: () => DailyStats;
  getWeekData: () => DailyStats[];
}

/* ─── LocalStorage helpers ──────────────────────────────────── */

const LS_KEYS = {
  state: "pomodoro_state",
  todos: "pomodoro_todos",
  logs:  "pomodoro_logs",
  stats: "pomodoro_daily_stats",
} as const;

function persist(state: Partial<PomodoroStore>) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadJSON<Record<string, unknown>>(LS_KEYS.state, {});
    localStorage.setItem(LS_KEYS.state, JSON.stringify({ ...existing, ...state }));
  } catch { /* ignore */ }
}

/* ─── Create Store ──────────────────────────────────────────── */

function initialSeconds(mode: TimerMode, focus: number, short: number, long: number): number {
  const map: Record<TimerMode, number> = { focus, shortBreak: short, longBreak: long };
  return map[mode] * 60;
}

export const usePomodoroStore = create<PomodoroStore>((set, get) => {
  // Restore saved state
  const saved = loadJSON<Record<string, unknown>>(LS_KEYS.state, {});
  const savedTodos   = loadJSON<Todo[]>(LS_KEYS.todos, []);
  const savedLogs    = loadJSON<PomodoroLog[]>(LS_KEYS.logs, []);
  const savedStats   = loadJSON<Record<string, DailyStats>>(LS_KEYS.stats, {});

  const focusMin  = (saved.focusMinutes as number)  ?? 25;
  const shortMin  = (saved.shortBreakMinutes as number) ?? 5;
  const longMin   = (saved.longBreakMinutes as number)  ?? 15;
  const mode      = (saved.mode as TimerMode) ?? "focus";
  const theme     = (saved.theme as ThemeMode) ?? "system";

  return {
    // Initial state
    mode,
    modeIndex: 0,
    seconds: initialSeconds(mode, focusMin, shortMin, longMin),
    totalSeconds: initialSeconds(mode, focusMin, shortMin, longMin),
    isRunning: false,

    focusMinutes: focusMin,
    shortBreakMinutes: shortMin,
    longBreakMinutes: longMin,

    theme,
    todos: savedTodos,
    activeTodoId: null,
    todoGroupFilter: "today",
    logs: savedLogs,
    dailyStats: savedStats,
    showHistory: false,

    /* ─── Timer Actions ─────────────────────────────── */

    tick: () => {
      const { seconds, mode } = get();
      if (seconds <= 1) {
        // Timer complete — handled by the component
        set({ seconds: 0 });
        return;
      }
      set({ seconds: seconds - 1 });
    },

    start: () => {
      const { seconds } = get();
      if (seconds <= 0) {
        get().reset();
        return;
      }
      set({ isRunning: true });
    },

    pause: () => set({ isRunning: false }),

    reset: () => {
      const { mode, focusMinutes, shortBreakMinutes, longBreakMinutes } = get();
      const mins = { focus: focusMinutes, shortBreak: shortBreakMinutes, longBreak: longBreakMinutes }[mode];
      const total = mins * 60;
      set({ seconds: total, totalSeconds: total, isRunning: false });
      persist({ seconds: total, isRunning: false });
    },

    skip: () => {
      set({ isRunning: false });
      // Advance to next mode
      const { modeIndex, focusMinutes, shortBreakMinutes, longBreakMinutes } = get();
      const nextIndex = (modeIndex + 1) % MODE_CYCLE.length;
      const nextMode = MODE_CYCLE[nextIndex];
      const mins = { focus: focusMinutes, shortBreak: shortBreakMinutes, longBreak: longBreakMinutes }[nextMode];
      const total = mins * 60;
      set({
        mode: nextMode,
        modeIndex: nextIndex,
        seconds: total,
        totalSeconds: total,
        isRunning: false,
      });
      persist({ mode: nextMode, modeIndex: nextIndex, seconds: total, isRunning: false });
    },

    setMode: (mode: TimerMode) => {
      const { focusMinutes, shortBreakMinutes, longBreakMinutes } = get();
      const mins = { focus: focusMinutes, shortBreak: shortBreakMinutes, longBreak: longBreakMinutes }[mode];
      const total = mins * 60;
      set({ mode, seconds: total, totalSeconds: total, isRunning: false });
      persist({ mode, seconds: total, isRunning: false });
    },

    setTheme: (theme: ThemeMode) => {
      set({ theme });
      persist({ theme });
    },

    setFocusMinutes: (m: number) => {
      set({ focusMinutes: m });
      persist({ focusMinutes: m });
    },
    setShortBreakMinutes: (m: number) => {
      set({ shortBreakMinutes: m });
      persist({ shortBreakMinutes: m });
    },
    setLongBreakMinutes: (m: number) => {
      set({ longBreakMinutes: m });
      persist({ longBreakMinutes: m });
    },

    setShowHistory: (v: boolean) => set({ showHistory: v }),

    /* ─── Todo Actions ──────────────────────────────── */

    addTodo: (text: string, group?: TodoGroup) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const todo: Todo = {
        id: generateId(),
        text: trimmed,
        group: group ?? "today",
        completed: false,
        createdAt: Date.now(),
        pomodoros: 0,
      };
      const todos = [todo, ...get().todos];
      set({ todos });
      localStorage.setItem(LS_KEYS.todos, JSON.stringify(todos));
    },

    toggleTodo: (id: string) => {
      const todos = get().todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed, completedAt: t.completed ? undefined : Date.now() } : t
      );
      set({ todos });
      localStorage.setItem(LS_KEYS.todos, JSON.stringify(todos));
    },

    deleteTodo: (id: string) => {
      const todos = get().todos.filter((t) => t.id !== id);
      set({ todos });
      localStorage.setItem(LS_KEYS.todos, JSON.stringify(todos));
    },

    setActiveTodo: (id: string | null) => set({ activeTodoId: id }),

    incrementTodoPomodoro: (id: string) => {
      const todos = get().todos.map((t) =>
        t.id === id ? { ...t, pomodoros: t.pomodoros + 1 } : t
      );
      set({ todos });
      localStorage.setItem(LS_KEYS.todos, JSON.stringify(todos));
    },

    changeTodoGroup: (id: string, group: TodoGroup) => {
      const todos = get().todos.map((t) =>
        t.id === id ? { ...t, group } : t
      );
      set({ todos });
      localStorage.setItem(LS_KEYS.todos, JSON.stringify(todos));
    },

    setTodoGroupFilter: (group: TodoGroup) => {
      set({ todoGroupFilter: group });
    },

    /* ─── Stats ─────────────────────────────────────── */

    getTodayStats: () => {
      const d = today();
      return get().dailyStats[d] ?? { date: d, focusCount: 0, focusMinutes: 0, completedTasks: 0 };
    },

    getWeekData: () => {
      const stats = get().dailyStats;
      const result: DailyStats[] = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        result.push(stats[key] ?? { date: key, focusCount: 0, focusMinutes: 0, completedTasks: 0 });
      }
      return result;
    },
  };
});

/* ─── Complete a focus session ──────────────────────────────── */

export function completeFocusSession() {
  const store = usePomodoroStore.getState();
  const d = today();
  const duration = store.focusMinutes;

  // Log
  const log: PomodoroLog = {
    id: generateId(),
    date: d,
    duration,
    todoId: store.activeTodoId ?? undefined,
    type: "focus",
  };
  const logs = [...store.logs, log];
  localStorage.setItem(LS_KEYS.logs, JSON.stringify(logs));

  // Daily stats
  const prev = store.dailyStats[d] ?? { date: d, focusCount: 0, focusMinutes: 0, completedTasks: 0 };
  const dailyStats = {
    ...store.dailyStats,
    [d]: {
      ...prev,
      focusCount: prev.focusCount + 1,
      focusMinutes: prev.focusMinutes + duration,
    },
  };
  localStorage.setItem(LS_KEYS.stats, JSON.stringify(dailyStats));

  // Increment active todo pomodoro
  if (store.activeTodoId) {
    store.incrementTodoPomodoro(store.activeTodoId);
  }

  // Advance cycle
  const nextIndex = (store.modeIndex + 1) % MODE_CYCLE.length;
  const nextMode = MODE_CYCLE[nextIndex];
  const mins = {
    focus: store.focusMinutes,
    shortBreak: store.shortBreakMinutes,
    longBreak: store.longBreakMinutes,
  }[nextMode];
  const total = mins * 60;

  usePomodoroStore.setState({
    mode: nextMode,
    modeIndex: nextIndex,
    seconds: total,
    totalSeconds: total,
    isRunning: false,
    logs,
    dailyStats,
  });

  persist({
    mode: nextMode,
    modeIndex: nextIndex,
    seconds: total,
    isRunning: false,
  });

  return { log, nextMode };
}

/* ─── Complete a break session ──────────────────────────────── */

export function completeBreakSession() {
  const store = usePomodoroStore.getState();
  const d = today();
  const duration =
    store.mode === "shortBreak" ? store.shortBreakMinutes : store.longBreakMinutes;

  const log: PomodoroLog = {
    id: generateId(),
    date: d,
    duration,
    type: store.mode,
  };
  const logs = [...store.logs, log];
  localStorage.setItem(LS_KEYS.logs, JSON.stringify(logs));

  // After break, go to next focus in cycle
  const nextIndex = (store.modeIndex + 1) % MODE_CYCLE.length;
  const nextMode = MODE_CYCLE[nextIndex];
  const mins = {
    focus: store.focusMinutes,
    shortBreak: store.shortBreakMinutes,
    longBreak: store.longBreakMinutes,
  }[nextMode];
  const total = mins * 60;

  usePomodoroStore.setState({
    mode: nextMode,
    modeIndex: nextIndex,
    seconds: total,
    totalSeconds: total,
    isRunning: false,
    logs,
  });

  persist({
    mode: nextMode,
    modeIndex: nextIndex,
    seconds: total,
    isRunning: false,
  });

  return { log, nextMode };
}
