"use client";
import { useState, useRef } from "react";
import { X, CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fmtDuration } from "@/lib/utils";
import type { Task } from "@/lib/types";

export interface StopData {
  startTime: string;   // HH:mm:ss
  endTime: string;     // HH:mm:ss
  durationSeconds: number;
  taskCount?: number;
  entryType: "auto" | "corrected";
}

interface Props {
  task: Task;
  recordedStartISO: string;
  onConfirm: (data: StopData) => void;
  onCancel: () => void;
}

function toHHmm(iso: string) {
  return format(new Date(iso), "HH:mm");
}

function calcSeconds(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, eh * 3600 + em * 60 - (sh * 3600 + sm * 60));
}

export default function StopModal({ task, recordedStartISO, onConfirm, onCancel }: Props) {
  const originalStart = useRef(toHHmm(recordedStartISO)).current;
  const originalEnd = useRef(format(new Date(), "HH:mm")).current;

  const [startTime, setStartTime] = useState(originalStart);
  const [endTime, setEndTime] = useState(originalEnd);
  const [count, setCount] = useState("");

  const durationSeconds = calcSeconds(startTime, endTime);
  const isModified = startTime !== originalStart || endTime !== originalEnd;

  function handleSave() {
    onConfirm({
      startTime: startTime + ":00",
      endTime: endTime + ":00",
      durationSeconds,
      taskCount: count ? Number(count) : undefined,
      entryType: isModified ? "corrected" : "auto",
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Stop Timer</h2>
            <p className="text-sm text-slate-500 mt-0.5">{task.name}</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-4 text-center">
          <p className="text-3xl font-bold text-blue-600">
            {durationSeconds > 0 ? fmtDuration(durationSeconds) : "—"}
          </p>
          <p className="text-sm text-slate-500 mt-1">duration</p>
          {durationSeconds <= 0 && startTime && endTime && (
            <p className="text-xs text-red-500 mt-1">End time must be after start time</p>
          )}
        </div>

        {isModified && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 mb-4 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            Times modified — entry will be marked as <strong className="ml-1">Corrected</strong>
          </div>
        )}

        {task.requiresProgressCount && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              How many did you process / complete?
            </label>
            <input
              type="number"
              min={0}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="e.g. 12"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={durationSeconds <= 0}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}
