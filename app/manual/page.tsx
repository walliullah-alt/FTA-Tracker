"use client";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { CheckCircle2, RefreshCw, AlertCircle, PenLine } from "lucide-react";
import Navbar from "@/components/Navbar";
import PersonPicker from "@/components/PersonPicker";
import { fetchTasks, fetchMembers, logEntry } from "@/lib/n8n";
import { usePerson } from "@/contexts/PersonContext";
import { fmtDuration } from "@/lib/utils";
import type { Task, TeamMember } from "@/lib/types";

function calcSeconds(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, eh * 3600 + em * 60 - (sh * 3600 + sm * 60));
}

export default function ManualEntryPage() {
  const { personName, setPersonName } = usePerson();
  const today = format(new Date(), "yyyy-MM-dd");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [booting, setBooting] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(today);
  const [taskName, setTaskName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [count, setCount] = useState("");

  const selectedTask = tasks.find((t) => t.name === taskName);
  const durationSeconds = useMemo(() => calcSeconds(startTime, endTime), [startTime, endTime]);

  useEffect(() => {
    async function boot() {
      try {
        const [m, t] = await Promise.all([fetchMembers(), fetchTasks()]);
        setMembers(m);
        setTasks(t);
      } catch {
        setMembersError("Could not load data. Check n8n webhooks are active.");
      }
      setBooting(false);
    }
    boot();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!personName || !taskName || !startTime || !endTime || durationSeconds <= 0) return;

    setSubmitting(true);
    setError(null);

    const entry = {
      date,
      personName,
      taskName,
      startTime: startTime + ":00",
      endTime: endTime + ":00",
      durationSeconds,
      taskCount: count ? Number(count) : null,
      entryType: "manual" as const,
    };

    try {
      await logEntry(entry);
      setSuccess(true);
      setTaskName("");
      setStartTime("");
      setEndTime("");
      setCount("");
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError("Failed to save entry. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
        <div className="flex items-center gap-2 mb-6">
          <PenLine className="w-5 h-5 text-slate-600" />
          <h1 className="text-xl font-bold text-slate-900">Manual Entry</h1>
        </div>

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

        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Entry saved successfully.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 mb-6 text-xs">
            <PenLine className="w-3.5 h-3.5 flex-shrink-0" />
            This entry will be marked as <strong className="ml-1">Manual</strong> for admin review.
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Task
              </label>
              <select
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">— Select a task —</option>
                {tasks.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {startTime && endTime && (
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-center">
                <span className="text-2xl font-bold text-blue-600">
                  {durationSeconds > 0 ? fmtDuration(durationSeconds) : "—"}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">duration</p>
                {durationSeconds <= 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    End time must be after start time
                  </p>
                )}
              </div>
            )}

            {selectedTask?.requiresProgressCount && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  How many did you process / complete?
                </label>
                <input
                  type="number"
                  min={0}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="e.g. 12"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !taskName || !startTime || !endTime || durationSeconds <= 0}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {submitting ? "Saving…" : "Save Manual Entry"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
