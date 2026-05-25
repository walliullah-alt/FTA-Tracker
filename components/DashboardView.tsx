"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { RefreshCw, ChevronRight } from "lucide-react";
import { fetchEntries, fetchMembers } from "@/lib/n8n";
import { fmtDuration } from "@/lib/utils";
import { usePerson } from "@/contexts/PersonContext";
import TaskBreakdownModal from "@/components/TaskBreakdownModal";
import type { TimeEntry, TeamMember, PersonSummary } from "@/lib/types";

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardView() {
  const { personName } = usePerson();
  const today = format(new Date(), "yyyy-MM-dd");

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [personFilter, setPersonFilter] = useState("all");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers().then(setMembers).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEntries({
        dateFrom,
        dateTo,
        personName: personFilter !== "all" ? personFilter : undefined,
      });
      setEntries(data);
    } catch { /* show empty */ } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, personFilter]);

  useEffect(() => { load(); }, [load]);

  const isRange = dateFrom !== dateTo;
  const dayCount = Math.max(
    1,
    differenceInCalendarDays(
      new Date(dateTo + "T00:00:00"),
      new Date(dateFrom + "T00:00:00")
    ) + 1
  );

  const summaries: PersonSummary[] = useMemo(() => {
    const byPerson: Record<string, {
      totalSeconds: number;
      tasks: Record<string, { seconds: number; count: number }>;
    }> = {};

    for (const e of entries) {
      if (!byPerson[e.personName]) {
        byPerson[e.personName] = { totalSeconds: 0, tasks: {} };
      }
      byPerson[e.personName].totalSeconds += e.durationSeconds;
      if (!byPerson[e.personName].tasks[e.taskName]) {
        byPerson[e.personName].tasks[e.taskName] = { seconds: 0, count: 0 };
      }
      byPerson[e.personName].tasks[e.taskName].seconds += e.durationSeconds;
      byPerson[e.personName].tasks[e.taskName].count += e.taskCount ?? 0;
    }

    return Object.entries(byPerson)
      .sort((a, b) => b[1].totalSeconds - a[1].totalSeconds)
      .map(([name, data]) => ({
        personName: name,
        totalSeconds: data.totalSeconds,
        avgDailySeconds: Math.round(data.totalSeconds / dayCount),
        tasks: Object.entries(data.tasks).map(([taskName, { seconds, count }]) => ({
          taskName,
          totalSeconds: seconds,
          avgDailySeconds: Math.round(seconds / dayCount),
          totalCount: count,
        })),
      }));
  }, [entries, dayCount]);

  const popupSummary = selectedPerson
    ? summaries.find((s) => s.personName === selectedPerson) ?? null
    : null;

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Employee
            </label>
            <select
              value={personFilter}
              onChange={(e) => setPersonFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All employees</option>
              {personName && (
                <option value={personName}>Me only</option>
              )}
              {members
                .filter((m) => m.name !== personName)
                .map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Apply
          </button>
        </div>
      </div>

      {/* Summary table */}
      {summaries.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold text-slate-800">
                {isRange
                  ? `${fmtDate(dateFrom)} – ${fmtDate(dateTo)}`
                  : fmtDate(dateFrom)}
              </h3>
              {isRange && (
                <span className="text-xs text-slate-400">
                  {dayCount} days · averages shown
                </span>
              )}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium text-right">
                  {isRange ? "Avg. Daily Time" : "Total Time"}
                </th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr
                  key={s.personName}
                  onClick={() => setSelectedPerson(s.personName)}
                  className="border-b border-slate-50 hover:bg-blue-50 cursor-pointer transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {s.personName
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">
                        {s.personName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-lg font-bold text-blue-600 group-hover:text-blue-700">
                      {fmtDuration(
                        isRange ? s.avgDailySeconds : s.totalSeconds
                      )}
                    </span>
                    {isRange && (
                      <p className="text-xs text-slate-400">
                        total {fmtDuration(s.totalSeconds)}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-300 group-hover:text-blue-400">
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
            Click a row to see task-by-task breakdown
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          {loading ? (
            <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
          ) : (
            <p>No data for the selected filters.</p>
          )}
        </div>
      )}

      {popupSummary && (
        <TaskBreakdownModal
          summary={popupSummary}
          entries={entries}
          isRange={isRange}
          dateFrom={dateFrom}
          dateTo={dateTo}
          dayCount={dayCount}
          onClose={() => setSelectedPerson(null)}
        />
      )}
    </div>
  );
}
