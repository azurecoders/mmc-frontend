import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/", inverted }: { className?: string; href?: string; inverted?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-lg", className)} aria-label="MMC Hospital home">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Plus className="h-5 w-5" strokeWidth={3} aria-hidden />
      </span>
      <span className={cn("text-lg font-bold tracking-tight", inverted ? "text-white" : "text-slate-900")}>
        MMC Hospital
      </span>
    </Link>
  );
}
