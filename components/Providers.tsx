"use client";
import { PersonProvider } from "@/contexts/PersonContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <PersonProvider>{children}</PersonProvider>;
}
