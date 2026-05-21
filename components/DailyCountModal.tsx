"use client";
import { useState } from "react";
import { X, CheckCircle2, RefreshCw, Lock, ClipboardList } from "lucide-react";
import { fmtDuration } from "@/lib/utils";
import { logEntry } from "@/lib/n8n";
import type { TimeEntry } from "@/lib/types";

interface TaskRow {
  taskName: string;
  totalSeconds: number;
  currentCount: number;
  isLocked: boolean;
}

interface Props {
  personName: string;
  date: string;
  entries: TimeEntry[];
  onClose: () => void;
  onCountsSubmitted: (newEntries: TimeEntry[]) => void;
}

function buildRows(entries: TimeEntry[]): TaskRow[] {
  const work = entries.filter((e) => e.entryType !== "count_update");
  const updates = entries.filter((e) => e.entryType === "count_update");
  const locked = new Set(updates.map((e) => e.taskName));

  const byTask: Record<string, { seconds: number; count: number }> = {};
  for (const e of work) {
    if (!byTask[e.taskName]) byTask[e.taskName] = { seconds: 0, count: 0 };
    byTask[e.taskName].seconds += e.durationSeconds;
    byTask[e.taskName].count += e.taskCount ?? 0;
  }
  for (const e of updates) {
    if (byTask[e.taskName]) byTask[e.taskName].count += e.taskCount ?? 0;
  }

  return Object.entries(byTask)
    .sort((a, b) => b[1].seconds - a[1].seconds)
    .map(([taskName, { seconds, count }]) => ({
      taskName,
      totalSeconds: seconds,
      currentCount: count,
      isLocked: locked.has(taskName),
    }));
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DailyCountModal({
  personName,
  date,
  entries,
  onClose,
  onCountsSubmitted,
}: Props) {
  const [rows, setRows] = useState<TaskRow[]>(() => buildRows(entries));
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const unlocked = rows.filter((r) => !r.isLocked);
  const hasInput = unlocked.some((r) => (inputs[r.taskName] ?? "") !== "");

  async function handleSubmit() {
    const toSave = unlocked.filter((r) => (inputs[r.taskName] ?? "") !== "");
    if (toSave.length === 0) return;

    setSaving(true);
    setError(null);

    const newEntries: TimeEntry[] = toSave.map((r) => ({
      date,
      personName,
      taskName: r.taskName,
      startTime: "",
      endTime: "",
      durationSeconds: 0,
      taskCount: Number(inputs[r.taskName]) - r.currentCount,
      entryType: "count_update" as const,
    }));

    try {
      await Promise.all(newEntries.map((e) => logEntry(e)));

      // Lock submitted tasks locally
      setRows((prev) =>
        prev.map((r) => {
          const saved = toSave.find((s) => s.taskName === r.taskName);
          return saved
            ? { ...r, currentCount: Number(inputs[r.taskName]), isLocked: true }
            : r;
        })
      );
      setInputs((prev) => {
        const next = { ...prev };
        toSave.forEach((r) => delete next[r.taskName]);
        return next;
      });
      onCountsSubmitted(newEntries);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">End-of-Day Counts</h2>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {personName} · {fmtDate(date)}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-xs">
          Enter the total count for each category. Once submitted, counts are locked for the day.
        </div>

        {/* Feedback */}
        {error && (
          <div className="mx-6 mt-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
            {error}
          </div>
        )}
        {success && (
          <div className="mx-6 mt-3 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            Counts saved successfully.
          </div>
        )}

        {/* Table */}
        <div className="p-6 pb-4">
          {rows.length === 0 ? (
            <p className="text-center text-slate-400 py-6 text-sm">No tasks logged today.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium text-right">Time Today</th>
                  <th className="pb-2 font-medium text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.taskName} className="border-b border-slate-50">
                    <td className="py-3 text-slate-800 font-medium">{r.taskName}</td>
                    <td className="py-3 text-right font-semibold text-slate-600">
                      {fmtDuration(r.totalSeconds)}
                    </td>
                    <td className="py-3 text-right">
                      {r.isLocked ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-semibold text-slate-700">
                            {r.currentCount > 0 ? r.currentCount : "—"}
                          </span>
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          value={inputs[r.taskName] ?? ""}
                          placeholder="Enter total"
                          onChange={(e) =>
                            setInputs((prev) => ({ ...prev, [r.taskName]: e.target.value }))
                          }
                          className="w-28 text-right border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 space-y-2">
          {rows.length > 0 && unlocked.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={saving || !hasInput}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {saving ? "Saving…" : "Submit Counts"}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
