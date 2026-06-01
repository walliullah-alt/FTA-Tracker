"use client";
import { useEffect, useState, useMemo } from "react";
import { format, subDays } from "date-fns";
import { CheckCircle2, RefreshCw, AlertCircle, CalendarX, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import PersonPicker from "@/components/PersonPicker";
import { fetchTasks, fetchMembers, fetchEntries, logEntry } from "@/lib/n8n";
import { usePerson } from "@/contexts/PersonContext";
import { fmtDuration } from "@/lib/utils";
import type { Task, TeamMember, TimeEntry } from "@/lib/types";

interface MissingRow {
  date: string;
  taskName: string;
  totalSeconds: number;
}

function findMissing(entries: TimeEntry[], countTasks: Set<string>): MissingRow[] {
  // nested: date → taskName → { seconds, count, hasUpdate }
  const map: Record<string, Record<string, { seconds: number; count: number; hasUpdate: boolean }>> = {};

  for (const e of entries) {
    if (!countTasks.has(e.taskName)) continue;
    if (!map[e.date]) map[e.date] = {};
    if (!map[e.date][e.taskName]) map[e.date][e.taskName] = { seconds: 0, count: 0, hasUpdate: false };

    if (e.entryType === "count_update") {
      map[e.date][e.taskName].count += e.taskCount ?? 0;
      map[e.date][e.taskName].hasUpdate = true;
    } else {
      map[e.date][e.taskName].seconds += e.durationSeconds;
      map[e.date][e.taskName].count += e.taskCount ?? 0;
    }
  }

  const rows: MissingRow[] = [];
  for (const [date, tasks] of Object.entries(map)) {
    for (const [taskName, v] of Object.entries(tasks)) {
      if (v.seconds > 0 && v.count === 0 && !v.hasUpdate) {
        rows.push({ date, taskName, totalSeconds: v.seconds });
      }
    }
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date) || a.taskName.localeCompare(b.taskName));
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MissedCountsPage() {
  const { personName, setPersonName } = usePerson();
  const today = format(new Date(), "yyyy-MM-dd");
  const defaultFrom = format(subDays(new Date(), 89), "yyyy-MM-dd");

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [booting, setBooting] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(defaultFrom);

  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [countTasks, setCountTasks] = useState<Set<string>>(new Set());

  // per-cell input: key = `date||taskName`
  const [inputs, setInputs] = useState<Record<string, string>>({});
  // per-cell remarks: same key format
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  // submitted keys
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  // which dates are currently saving
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Boot
  useEffect(() => {
    async function boot() {
      try {
        const [m, t] = await Promise.all([fetchMembers(), fetchTasks()]);
        setMembers(m);
        setCountTasks(new Set(t.filter((x: Task) => x.requiresProgressCount).map((x: Task) => x.name)));
      } catch {
        setMembersError("Could not load data. Check n8n webhooks are active.");
      }
      setBooting(false);
    }
    boot();
  }, []);

  // Load entries when person or dateFrom changes
  useEffect(() => {
    if (!personName) return;
    setLoading(true);
    fetchEntries({ personName, dateFrom, dateTo: today })
      .then(setAllEntries)
      .catch(() => setAllEntries([]))
      .finally(() => setLoading(false));
  }, [personName, dateFrom, today]);

  const missing = useMemo(
    () => findMissing(allEntries, countTasks),
    [allEntries, countTasks]
  );

  // Group by date, excluding already-submitted rows
  const byDate = useMemo(() => {
    const map: Record<string, MissingRow[]> = {};
    for (const row of missing) {
      const key = `${row.date}||${row.taskName}`;
      if (submitted.has(key)) continue;
      if (!map[row.date]) map[row.date] = [];
      map[row.date].push(row);
    }
    return map;
  }, [missing, submitted]);

  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  function cellKey(date: string, taskName: string) {
    return `${date}||${taskName}`;
  }

  async function handleSubmitDate(date: string) {
    const rows = byDate[date] ?? [];
    const toSave = rows.filter((r) => (inputs[cellKey(date, r.taskName)] ?? "") !== "");
    if (toSave.length === 0) return;

    setSavingDate(date);
    setErrors((prev) => { const n = { ...prev }; delete n[date]; return n; });

    try {
      await Promise.all(
        toSave.map((r) => {
          const key = cellKey(date, r.taskName);
          return logEntry({
            date,
            personName: personName!,
            taskName: r.taskName,
            startTime: "",
            endTime: "",
            durationSeconds: 0,
            taskCount: Number(inputs[key]),
            entryType: "count_update",
            remarks: remarksMap[key] || undefined,
          });
        })
      );
      setSubmitted((prev) => {
        const next = new Set(prev);
        toSave.forEach((r) => next.add(cellKey(date, r.taskName)));
        return next;
      });
    } catch {
      setErrors((prev) => ({ ...prev, [date]: "Failed to save. Please try again." }));
    } finally {
      setSavingDate(null);
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
    return <PersonPicker members={members} onSelect={setPersonName} error={membersError} />;
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <CalendarX className="w-5 h-5 text-slate-600" />
          <h1 className="text-xl font-bold text-slate-900">Missed Counts</h1>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Dates where you worked on a count-tracked category but never submitted a count.
        </p>

        {/* Date range filter */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Show from</label>
            <input
              type="date"
              value={dateFrom}
              max={today}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <p className="text-xs text-slate-400 pb-1">to today</p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : dates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-800">All caught up!</p>
            <p className="text-sm text-slate-400 mt-1">
              No missing counts found in the selected date range.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {dates.map((date) => {
              const rows = byDate[date];
              const isSaving = savingDate === date;
              const hasInput = rows.some((r) => (inputs[cellKey(date, r.taskName)] ?? "") !== "");

              return (
                <div
                  key={date}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Date header */}
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <p className="font-semibold text-slate-800 text-sm">{fmtDate(date)}</p>
                    <span className="text-xs text-slate-400">
                      {rows.length} categor{rows.length !== 1 ? "ies" : "y"} missing
                    </span>
                  </div>

                  {/* Rows */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                        <th className="px-5 py-2 font-medium">Category</th>
                        <th className="px-5 py-2 font-medium text-right">Time Worked</th>
                        <th className="px-5 py-2 font-medium text-right">Count</th>
                        <th className="px-5 py-2 font-medium text-right">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const key = cellKey(date, r.taskName);
                        const isSubmitted = submitted.has(key);
                        return (
                          <tr key={r.taskName} className="border-b border-slate-50">
                            <td className="px-5 py-3 font-medium text-slate-800">{r.taskName}</td>
                            <td className="px-5 py-3 text-right text-slate-600 font-semibold">
                              {fmtDuration(r.totalSeconds)}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {isSubmitted ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="text-green-600 font-semibold">
                                    {inputs[key]}
                                  </span>
                                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  min={0}
                                  value={inputs[key] ?? ""}
                                  placeholder="Enter total"
                                  onChange={(e) =>
                                    setInputs((prev) => ({ ...prev, [key]: e.target.value }))
                                  }
                                  className="w-24 text-right border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                              )}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {isSubmitted ? (
                                <span className="text-xs text-slate-400">
                                  {remarksMap[key] || "—"}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={remarksMap[key] ?? ""}
                                  placeholder="Optional note"
                                  onChange={(e) =>
                                    setRemarksMap((prev) => ({ ...prev, [key]: e.target.value }))
                                  }
                                  className="w-36 text-right border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Error + submit */}
                  <div className="px-5 py-3 border-t border-slate-100">
                    {errors[date] && (
                      <div className="flex items-center gap-2 text-red-600 text-xs mb-2">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {errors[date]}
                      </div>
                    )}
                    <button
                      onClick={() => handleSubmitDate(date)}
                      disabled={isSaving || !hasInput}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                    >
                      {isSaving ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {isSaving ? "Saving…" : "Submit for this date"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
