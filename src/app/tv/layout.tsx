import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Waiting Lounge Screen · MMC Hospital",
  description: "High-contrast public lounge display for token numbers and doctor cabins.",
};

export default function TVLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-950 text-white">{children}</div>;
}
