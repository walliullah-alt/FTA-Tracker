"use client";
import { fmtDuration } from "@/lib/utils";
import type { TimeEntry } from "@/lib/types";
import { Clock, Hash } from "lucide-react";

export default function TodayEntries({ entries }: { entries: TimeEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-slate-400 py-6 text-sm">
        No entries yet today.
      </p>
    );
  }

  const totalSeconds = entries.reduce((s, e) => s + e.durationSeconds, 0);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs text-slate-500 px-1 mb-3">
        <span>{entries.length} entries</span>
        <span className="font-medium text-slate-700">
          Total: {fmtDuration(totalSeconds)}
        </span>
      </div>
      {entries.map((entry, i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 text-sm truncate">
              {entry.taskName}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {entry.startTime} → {entry.endTime}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {entry.taskCount != null && (
              <span className="flex items-center gap-0.5 text-xs text-slate-500">
                <Hash className="w-3 h-3" />
                {entry.taskCount}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-600 font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {fmtDuration(entry.durationSeconds)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
