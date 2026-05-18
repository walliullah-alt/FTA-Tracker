import type { Task, TeamMember, TimeEntry, DashboardFilters } from "./types";

const N8N_BASE =
  process.env.NEXT_PUBLIC_N8N_BASE_URL || "https://n8nnextventures.xyz";

// Returns all 29 tasks from column C/D — shared by everyone
export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${N8N_BASE}/webhook/fta-tasks`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch tasks from n8n");
  return res.json();
}

// Returns unique team member names from the source sheet
export async function fetchMembers(): Promise<TeamMember[]> {
  const res = await fetch(`${N8N_BASE}/webhook/fta-members`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch team members from n8n");
  return res.json();
}

// Appends one row to the Activity Log sheet
export async function logEntry(entry: Omit<TimeEntry, never>): Promise<void> {
  const res = await fetch(`${N8N_BASE}/webhook/fta-log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error("Failed to log entry via n8n");
}

// Reads entries from Activity Log with optional filters
export async function fetchEntries(
  filters?: DashboardFilters
): Promise<TimeEntry[]> {
  const params = new URLSearchParams();
  if (filters?.personName) params.set("personName", filters.personName);
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);

  const res = await fetch(
    `${N8N_BASE}/webhook/fta-entries?${params.toString()}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch entries from n8n");
  return res.json();
}
