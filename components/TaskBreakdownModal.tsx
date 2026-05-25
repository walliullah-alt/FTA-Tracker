"use client";
import { useState } from "react";
import { X, ChevronRight, ArrowLeft } from "lucide-react";
import { fmtDuration } from "@/lib/utils";
import type { PersonSummary, TimeEntry } from "@/lib/types";

interface Props {
  summary: PersonSummary;
  entries: TimeEntry[];
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

function fmtShortDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function fmtTime(t: string) {
  return t ? t.substring(0, 5) : "—"; // HH:mm:ss → HH:mm
}

function fmtAvgCount(total: number, days: number): string {
  const avg = total / days;
  return avg % 1 === 0 ? String(avg) : avg.toFixed(1);
}

export default function TaskBreakdownModal({
  summary,
  entries,
  isRange,
  dateFrom,
  dateTo,
  dayCount,
  onClose,
}: Props) {
  const [drillTask, setDrillTask] = useState<string | null>(null);

  const sortedTasks = [...summary.tasks].sort((a, b) => b.totalSeconds - a.totalSeconds);
  const totalCount = summary.tasks.reduce((s, t) => s + t.totalCount, 0);
  const displaySeconds = isRange ? summary.avgDailySeconds : summary.totalSeconds;

  // Sessions for the drill-down view
  const sessions = drillTask
    ? entries
        .filter(
          (e) =>
            e.personName === summary.personName &&
            e.taskName === drillTask &&
            e.entryType !== "count_update"
        )
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime.localeCompare(b.startTime);
        })
    : [];

  const sessionTotal = sessions.reduce((s, e) => s + e.durationSeconds, 0);
  const sessionCount = sessions.reduce((s, e) => s + (e.taskCount ?? 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">

        {/* ── Header ── */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            {drillTask && (
              <button
                onClick={() => setDrillTask(null)}
                className="text-slate-400 hover:text-blue-600 flex-shrink-0 transition-colors"
                title="Back to summary"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">
                {drillTask ?? summary.personName}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {drillTask
                  ? summary.personName + " · " + (isRange
                      ? `${fmtDate(dateFrom)} – ${fmtDate(dateTo)}`
                      : fmtDate(dateFrom))
                  : isRange
                  ? `${fmtDate(dateFrom)} – ${fmtDate(dateTo)} (${dayCount} day${dayCount !== 1 ? "s" : ""})`
                  : fmtDate(dateFrom)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-4 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Banner ── */}
        {!drillTask && (
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
        )}

        {/* ── Content ── */}
        <div className="p-6 overflow-x-auto">
          {drillTask ? (
            /* ── Session drill-down ── */
            sessions.length === 0 ? (
              <p className="text-center text-slate-400 py-6 text-sm">No sessions found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                    {isRange && <th className="pb-2 font-medium">Date</th>}
                    <th className="pb-2 font-medium">Start</th>
                    <th className="pb-2 font-medium">End</th>
                    <th className="pb-2 font-medium text-right">Duration</th>
                    <th className="pb-2 font-medium text-right">Count</th>
                    <th className="pb-2 font-medium text-right">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((e, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {isRange && (
                        <td className="py-2.5 text-slate-500 text-xs">
                          {fmtShortDate(e.date)}
                        </td>
                      )}
                      <td className="py-2.5 text-slate-700 font-mono text-xs">
                        {fmtTime(e.startTime)}
                      </td>
                      <td className="py-2.5 text-slate-700 font-mono text-xs">
                        {fmtTime(e.endTime)}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-800">
                        {fmtDuration(e.durationSeconds)}
                      </td>
                      <td className="py-2.5 text-right text-slate-500">
                        {e.taskCount != null && e.taskCount > 0 ? e.taskCount : "—"}
                      </td>
                      <td className="py-2.5 text-right">
                        {e.entryType === "manual" && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Manual
                          </span>
                        )}
                        {e.entryType === "corrected" && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            Corrected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200">
                    <td
                      colSpan={isRange ? 3 : 2}
                      className="pt-3 font-bold text-slate-800"
                    >
                      Total · {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                    </td>
                    <td className="pt-3 text-right font-bold text-blue-600">
                      {fmtDuration(sessionTotal)}
                    </td>
                    <td className="pt-3 text-right font-bold text-slate-600">
                      {sessionCount > 0 ? sessionCount : "—"}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )
          ) : isRange ? (
            /* ── Multi-day summary ── */
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-medium">Task</th>
                  <th className="pb-2 font-medium text-right">Avg Time/Day</th>
                  <th className="pb-2 font-medium text-right">Total Time</th>
                  <th className="pb-2 font-medium text-right">Avg #/Day</th>
                  <th className="pb-2 font-medium text-right">Total #</th>
                  <th className="pb-2 w-5" />
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((t) => (
                  <tr
                    key={t.taskName}
                    onClick={() => setDrillTask(t.taskName)}
                    className="border-b border-slate-50 hover:bg-blue-50 cursor-pointer group transition-colors"
                  >
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
                    <td className="py-2.5 text-slate-300 group-hover:text-blue-400">
                      <ChevronRight className="w-4 h-4" />
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
                  <td />
                </tr>
              </tfoot>
            </table>
          ) : (
            /* ── Single day summary ── */
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-medium">Task</th>
                  <th className="pb-2 font-medium text-right">Time</th>
                  <th className="pb-2 font-medium text-right">Count</th>
                  <th className="pb-2 w-5" />
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((t) => (
                  <tr
                    key={t.taskName}
                    onClick={() => setDrillTask(t.taskName)}
                    className="border-b border-slate-50 hover:bg-blue-50 cursor-pointer group transition-colors"
                  >
                    <td className="py-2.5 text-slate-800 font-medium">{t.taskName}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-700">
                      {fmtDuration(t.totalSeconds)}
                    </td>
                    <td className="py-2.5 text-right text-slate-500">
                      {t.totalCount > 0 ? t.totalCount : "—"}
                    </td>
                    <td className="py-2.5 text-slate-300 group-hover:text-blue-400">
                      <ChevronRight className="w-4 h-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td className="pt-3 font-bold text-slate-800">Total</td>
                  <td className="pt-3 text-right font-bold text-blue-600">
                    {fmtDuration(summary.totalSeconds)}
                  </td>
                  <td className="pt-3 text-right font-bold text-slate-600">
                    {totalCount > 0 ? totalCount : "—"}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* ── Hint / Close ── */}
        <div className="px-6 pb-5">
          {!drillTask && (
            <p className="text-xs text-slate-400 mb-3">
              Click a row to see individual sessions
            </p>
          )}
          <button
            onClick={drillTask ? () => setDrillTask(null) : onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
          >
            {drillTask ? "← Back to summary" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
