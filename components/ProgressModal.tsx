"use client";
import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import type { Task } from "@/lib/types";

interface Props {
  task: Task;
  durationMinutes: number;
  onConfirm: (taskCount?: number) => void;
  onCancel: () => void;
}

function fmtMin(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export default function ProgressModal({
  task,
  durationMinutes,
  onConfirm,
  onCancel,
}: Props) {
  const [count, setCount] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Task Complete</h2>
            <p className="text-sm text-slate-500 mt-0.5">{task.name}</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-5 text-center">
          <p className="text-3xl font-bold text-blue-600">{fmtMin(durationMinutes)}</p>
          <p className="text-sm text-slate-500 mt-1">time logged</p>
        </div>

        {task.requiresProgressCount && (
          <div className="mb-5">
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
            onClick={() =>
              onConfirm(
                task.requiresProgressCount && count ? Number(count) : undefined
              )
            }
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}
