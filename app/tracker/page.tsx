"use client";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Play, Square, RefreshCw, AlertCircle, ClipboardList } from "lucide-react";
import Navbar from "@/components/Navbar";
import PersonPicker from "@/components/PersonPicker";
import StopModal, { type StopData } from "@/components/StopModal";
import DailyCountModal from "@/components/DailyCountModal";
import TodayEntries from "@/components/TodayEntries";
import { fetchTasks, fetchMembers, logEntry, fetchEntries } from "@/lib/n8n";
import { usePerson } from "@/contexts/PersonContext";
import type { Task, ActiveTask, TimeEntry, TeamMember } from "@/lib/types";

const STORAGE_KEY = "fta_active_task";

function padTwo(n: number) {
  return String(n).padStart(2, "0");
}
function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${padTwo(h)}:${padTwo(m)}:${padTwo(s)}`;
}

export default function TrackerPage() {
  const { personName, setPersonName } = usePerson();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDailyCount, setShowDailyCount] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const loadTodayEntries = useCallback(
    async (name: string) => {
      try {
        const data = await fetchEntries({
          personName: name,
          dateFrom: today,
          dateTo: today,
        });
        setTodayEntries(data);
      } catch { /* non-fatal */ }
    },
    [today]
  );

  // Boot: load members + tasks together (tasks are shared by everyone)
  useEffect(() => {
    async function boot() {
      try {
        const [m, t] = await Promise.all([fetchMembers(), fetchTasks()]);
        setMembers(m);
        setTasks(t);
      } catch {
        setMembersError(
          "Could not load data. Check n8n webhooks fta-members and fta-tasks are active."
        );
      }
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setActiveTask(JSON.parse(stored));
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setBooting(false);
    }
    boot();
  }, []);

  useEffect(() => {
    if (personName) loadTodayEntries(personName);
  }, [personName, loadTodayEntries]);

  // Live timer
  useEffect(() => {
    if (!activeTask) return;
    const tick = () =>
      setElapsed(
        Math.floor(
          (Date.now() - new Date(activeTask.startTime).getTime()) / 1000
        )
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeTask]);

  function handleStart() {
    const task = tasks.find((t) => t.name === selectedTask);
    if (!task) return;
    const active: ActiveTask = { task, startTime: new Date().toISOString() };
    setActiveTask(active);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    setElapsed(0);
    setError(null);
  }

  function handleStop() {
    if (!activeTask) return;
    setShowModal(true);
  }

  function handleConfirm(data: StopData) {
    if (!activeTask || !personName) return;

    const entry = {
      date: today,
      personName,
      taskName: activeTask.task.name,
      startTime: data.startTime,
      endTime: data.endTime,
      durationSeconds: data.durationSeconds,
      taskCount: null,
      entryType: data.entryType,
      remarks: data.remarks || undefined,
    };

    setShowModal(false);
    localStorage.removeItem(STORAGE_KEY);
    setActiveTask(null);
    setElapsed(0);
    setTodayEntries((prev) => [entry, ...prev]);
    setError(null);

    logEntry(entry).catch(() =>
      setError("Entry shown locally but failed to sync to sheet. Refresh to check.")
    );
  }

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!personName) {
    return (
      <PersonPicker
        members={members}
        onSelect={setPersonName}
        error={membersError}
      />
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600 text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTask ? (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl mb-6">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
              Currently tracking
            </p>
            <h2 className="text-xl font-bold mb-4">{activeTask.task.name}</h2>
            <div className="text-5xl font-mono font-bold tracking-tight mb-6">
              {formatElapsed(elapsed)}
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={handleStop}
                className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-2.5 rounded-xl transition-colors"
              >
                <Square className="w-4 h-4 fill-blue-600" />
                Stop
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-slate-800 mb-4">
              Start a new task
            </h2>
            {tasks.length === 0 ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading tasks…
              </div>
            ) : (
              <>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
                >
                  <option value="">— Select a task —</option>
                  {tasks.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleStart}
                  disabled={!selectedTask}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Start
                </button>
              </>
            )}
          </div>
        )}

        {!activeTask && todayEntries.some((e) => e.entryType !== "count_update") && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800 text-sm">End-of-Day Counts</p>
              <p className="text-xs text-slate-400 mt-0.5">Submit your totals for today&apos;s categories</p>
            </div>
            <button
              onClick={() => setShowDailyCount(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Submit Counts
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">
              Today&apos;s Entries
            </h2>
            <button
              onClick={() => loadTodayEntries(personName)}
              className="text-slate-400 hover:text-slate-600"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <TodayEntries entries={todayEntries} />
        </div>
      </main>

      {showModal && activeTask && (
        <StopModal
          task={activeTask.task}
          recordedStartISO={activeTask.startTime}
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}

      {showDailyCount && personName && (
        <DailyCountModal
          personName={personName}
          date={today}
          entries={todayEntries}
          onClose={() => setShowDailyCount(false)}
          onCountsSubmitted={(newEntries) =>
            setTodayEntries((prev) => [...newEntries, ...prev])
          }
        />
      )}
    </>
  );
}
