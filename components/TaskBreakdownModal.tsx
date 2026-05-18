"use client";
import { X } from "lucide-react";
import type { PersonSummary } from "@/lib/types";

interface Props {
  summary: PersonSummary;
  isRange: boolean;
  dateFrom: string;
  dateTo: string;
  dayCount: number;
  onClose: () => void;
}

function fmtMin(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TaskBreakdownModal({
  summary,
  isRange,
  dateFrom,
  dateTo,
  dayCount,
  onClose,
}: Props) {
  const totalDisplay = isRange
    ? fmtMin(summary.avgDailyMinutes)
    : fmtMin(summary.totalMinutes);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
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

        {/* Summary pill */}
        <div className="px-6 py-4 bg-blue-50">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">{totalDisplay}</span>
            <span className="text-sm text-blue-500">
              {isRange ? "average per day" : "total time logged"}
            </span>
          </div>
          {isRange && (
            <p className="text-xs text-blue-400 mt-0.5">
              Total across period: {fmtMin(summary.totalMinutes)}
            </p>
          )}
        </div>

        {/* Task breakdown table */}
        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wide">
                <th className="pb-2 font-medium">Task</th>
                <th className="pb-2 font-medium text-right">
                  {isRange ? "Avg / Day" : "Time"}
                </th>
                <th className="pb-2 font-medium text-right">
                  {isRange ? "Total Count" : "Count"}
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.tasks
                .sort((a, b) => b.totalMinutes - a.totalMinutes)
                .map((t) => (
                  <tr key={t.taskName} className="border-b border-slate-50">
                    <td className="py-2.5 text-slate-800 font-medium">{t.taskName}</td>
                    <td className="py-2.5 text-right text-slate-700 font-semibold">
                      {isRange ? fmtMin(t.avgDailyMinutes) : fmtMin(t.totalMinutes)}
                    </td>
                    <td className="py-2.5 text-right text-slate-500">
                      {t.totalCount > 0 ? t.totalCount : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td className="pt-3 font-bold text-slate-800">
                  {isRange ? "Avg Total / Day" : "Total"}
                </td>
                <td className="pt-3 text-right font-bold text-blue-600">
                  {totalDisplay}
                </td>
                <td className="pt-3 text-right font-bold text-slate-600">
                  {summary.tasks.reduce((s, t) => s + t.totalCount, 0) || "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

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
