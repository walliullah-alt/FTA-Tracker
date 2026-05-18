"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, BarChart2, LogOut } from "lucide-react";
import clsx from "clsx";
import { usePerson } from "@/contexts/PersonContext";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Navbar() {
  const pathname = usePathname();
  const { personName, clearPerson } = usePerson();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-blue-600 text-lg">
            <Clock className="w-5 h-5" />
            <span>FTA Tracker</span>
          </div>
          <div className="flex gap-1">
            <Link
              href="/tracker"
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname === "/tracker"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Clock className="w-4 h-4" />
              Tracker
            </Link>
            <Link
              href="/dashboard"
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname === "/dashboard"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <BarChart2 className="w-4 h-4" />
              Dashboard
            </Link>
          </div>
        </div>

        {personName && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {initials(personName)}
            </div>
            <span className="text-sm text-slate-600 hidden sm:block">
              {personName}
            </span>
            <button
              onClick={clearPerson}
              title="Switch person"
              className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
