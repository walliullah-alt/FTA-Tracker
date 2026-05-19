"use client";
import { useState } from "react";
import { X, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { fmtDuration } from "@/lib/utils";
import { logEntry } from "@/lib/n8n";
import type { PersonSummary } from "@/lib/types";

interface Props {
  summary: PersonSummary;
  isRange: boolean;
  dateFrom: string;
  dateTo: string;
  dayCount: number;
  onClose: () => void;
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtAvgCount(total: number, days: number): string {
  const avg = total / days;
  return avg % 1 === 0 ? String(avg) : avg.toFixed(1);
}

export default function TaskBreakdownModal({
  summary,
  isRange,
  dateFrom,
  dateTo,
  dayCount,
  onClose,
}: Props) {
  const [countEdits, setCountEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const sortedTasks = [...summary.tasks].sort((a, b) => b.totalSeconds - a.totalSeconds);
  const totalCount = summary.tasks.reduce((s, t) => s + t.totalCount, 0);
  const displaySeconds = isRange ? summary.avgDailySeconds : summary.totalSeconds;

  const hasEdits = Object.entries(countEdits).some(([taskName, val]) => {
    const task = summary.tasks.find((t) => t.taskName === taskName);
    return task !== undefined && val !== "" && Number(val) !== task.totalCount;
  });

  async function handleSaveCounts() {
    setSaving(true);
    setSaveError(null);
    try {
      const toSave = Object.entries(countEdits).filter(([taskName, val]) => {
        const task = summary.tasks.find((t) => t.taskName === taskName);
        return task && val !== "" && Number(val) !== task.totalCount;
      });
      await Promise.all(
        toSave.map(([taskName, val]) => {
          const task = summary.tasks.find((t) => t.taskName === taskName)!;
          const delta = Number(val) - task.totalCount;
          return logEntry({
            date: dateFrom,
            personName: summary.personName,
            taskName,
            startTime: "",
            endTime: "",
            durationSeconds: 0,
            taskCount: delta,
            entryType: "count_update",
          });
        })
      );
      setSaveSuccess(true);
      setCountEdits({});
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{summary.personName}</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {isRange
                ? `${fmtDate(dateFrom)} – ${fmtDate(dateTo)} (${dayCount} day${dayCount !== 1 ? "s" : ""})`
                : fmtDate(dateFrom)}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total banner */}
        <div className="px-6 py-4 bg-blue-50">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">
              {fmtDuration(displaySeconds)}
            </span>
            <span className="text-sm text-blue-500">
              {isRange ? "average per day" : "total time logged"}
            </span>
          </div>
          {isRange && (
            <p className="text-xs text-blue-400 mt-0.5">
              Total across period: {fmtDuration(summary.totalSeconds)} · {dayCount} days
            </p>
          )}
        </div>

        {/* Save feedback */}
        {saveError && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            Count updates saved.
          </div>
        )}

        {/* Task table */}
        <div className="p-6 pb-3 overflow-x-auto">
          {isRange ? (
            /* ── Multi-day: 5 columns ── */
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-medium">Task</th>
                  <th className="pb-2 font-medium text-right">Avg Time/Day</th>
                  <th className="pb-2 font-medium text-right">Total Time</th>
                  <th className="pb-2 font-medium text-right">Avg #/Day</th>
                  <th className="pb-2 font-medium text-right">Total #</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((t) => (
                  <tr key={t.taskName} className="border-b border-slate-50">
                    <td className="py-2.5 text-slate-800 font-medium">{t.taskName}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-700">
                      {fmtDuration(t.avgDailySeconds)}
                    </td>
                    <td className="py-2.5 text-right text-slate-500">
                      {fmtDuration(t.totalSeconds)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-700">
                      {t.totalCount > 0 ? fmtAvgCount(t.totalCount, dayCount) : "—"}
                    </td>
                    <td className="py-2.5 text-right text-slate-500">
                      {t.totalCount > 0 ? t.totalCount : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td className="pt-3 font-bold text-slate-800">Total</td>
                  <td className="pt-3 text-right font-bold text-blue-600">
                    {fmtDuration(summary.avgDailySeconds)}
                  </td>
                  <td className="pt-3 text-right font-bold text-slate-700">
                    {fmtDuration(summary.totalSeconds)}
                  </td>
                  <td className="pt-3 text-right font-bold text-slate-700">
                    {totalCount > 0 ? fmtAvgCount(totalCount, dayCount) : "—"}
                  </td>
                  <td className="pt-3 text-right font-bold text-slate-700">
                    {totalCount > 0 ? totalCount : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            /* ── Single day: editable counts ── */
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-medium">Task</th>
                  <th className="pb-2 font-medium text-right">Time</th>
                  <th className="pb-2 font-medium text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((t) => {
                  const editVal = countEdits[t.taskName];
                  const displayVal =
                    editVal !== undefined ? editVal : t.totalCount > 0 ? String(t.totalCount) : "";
                  const isModified =
                    editVal !== undefined &&
                    editVal !== "" &&
                    Number(editVal) !== t.totalCount;
                  return (
                    <tr key={t.taskName} className="border-b border-slate-50">
                      <td className="py-2 text-slate-800 font-medium">{t.taskName}</td>
                      <td className="py-2 text-right font-semibold text-slate-700">
                        {fmtDuration(t.totalSeconds)}
                      </td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          value={displayVal}
                          placeholder="—"
                          onChange={(e) =>
                            setCountEdits((prev) => ({
                              ...prev,
                              [t.taskName]: e.target.value,
                            }))
                          }
                          className={`w-20 text-right border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                            isModified
                              ? "border-blue-400 bg-blue-50 text-blue-700 font-semibold"
                              : "border-slate-200 text-slate-600"
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td className="pt-3 font-bold text-slate-800">Total</td>
                  <td className="pt-3 text-right font-bold text-blue-600">
                    {fmtDuration(summary.totalSeconds)}
                  </td>
                  <td className="pt-3 text-right font-bold text-slate-700 pr-1">
                    {totalCount > 0 ? totalCount : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Single-day: hint + save button */}
        {!isRange && (
          <div className="px-6 pb-3">
            <p className="text-xs text-slate-400 mb-3">
              Edit the count fields above to update totals for this day.
            </p>
            {hasEdits && (
              <button
                onClick={handleSaveCounts}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mb-2"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {saving ? "Saving…" : "Save Count Updates"}
              </button>
            )}
          </div>
        )}

        {/* Close */}
        <div className="px-6 pb-5">
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
