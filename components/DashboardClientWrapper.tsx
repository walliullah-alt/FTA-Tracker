"use client";
import dynamic from "next/dynamic";

const DashboardView = dynamic(() => import("@/components/DashboardView"), {
  ssr: false,
  loading: () => (
    <div className="text-center py-20 text-slate-400">Loading dashboard…</div>
  ),
});

export default function DashboardClientWrapper() {
  return <DashboardView />;
}
