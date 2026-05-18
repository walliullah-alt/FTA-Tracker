"use client";
import { useState } from "react";
import { Users, Clock } from "lucide-react";
import type { TeamMember } from "@/lib/types";

interface Props {
  members: TeamMember[];
  onSelect: (name: string) => void;
  error?: string | null;
}

export default function PersonPicker({ members, onSelect, error }: Props) {
  const [selected, setSelected] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-4">
            <Clock className="w-9 h-9 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">FTA Tracker</h1>
        <p className="text-slate-500 text-sm mb-7">
          Full Time Allocation — Operations
        </p>

        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium mb-2">
          <Users className="w-4 h-4" />
          Who are you?
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
        >
          <option value="">— Select your name —</option>
          {members.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
