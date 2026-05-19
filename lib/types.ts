export interface Task {
  name: string;
  requiresProgressCount: boolean;
}

export interface TeamMember {
  name: string;
}

export interface TimeEntry {
  date: string;             // YYYY-MM-DD  → col A
  personName: string;       // col B
  taskName: string;         // col C
  startTime: string;        // HH:MM:SS   → col D
  endTime: string;          // HH:MM:SS   → col E
  durationSeconds: number;  // col F (stored as integer seconds for accuracy)
  taskCount: number | null; // col G (null when not applicable)
  entryType: "auto" | "manual" | "corrected"; // col H
}

export interface ActiveTask {
  task: Task;
  startTime: string; // ISO 8601 stored in localStorage
}

export interface DashboardFilters {
  personName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PersonSummary {
  personName: string;
  totalSeconds: number;
  avgDailySeconds: number;
  tasks: TaskBreakdown[];
}

export interface TaskBreakdown {
  taskName: string;
  totalSeconds: number;
  avgDailySeconds: number;
  totalCount: number;
}
