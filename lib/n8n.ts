import type { Task, TeamMember, TimeEntry, DashboardFilters } from "./types";

// All requests go through /api/n8n — Next.js server proxies to n8n (no CORS issues)
const PROXY = "/api/n8n";

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${PROXY}?path=fta-tasks`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function fetchMembers(): Promise<TeamMember[]> {
  const res = await fetch(`${PROXY}?path=fta-members`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch members");
  return res.json();
}

export async function logEntry(entry: Omit<TimeEntry, never>): Promise<void> {
  const res = await fetch(`${PROXY}?path=fta-log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error("Failed to log entry");
}

export async function fetchEntries(
  filters?: DashboardFilters
): Promise<TimeEntry[]> {
  const params = new URLSearchParams({ path: "fta-entries" });
  if (filters?.personName) params.set("personName", filters.personName);
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);

  const res = await fetch(`${PROXY}?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch entries");
  return res.json();
}
