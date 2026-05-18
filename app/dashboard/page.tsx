import Navbar from "@/components/Navbar";
import DashboardClientWrapper from "@/components/DashboardClientWrapper";

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          FTA Dashboard
        </h1>
        <DashboardClientWrapper />
      </main>
    </>
  );
}
