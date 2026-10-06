import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

const points = [
  "Book the right specialist with AI guidance",
  "Track your place in the queue, live",
  "Prescriptions and lab results in one place",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <main id="main" className="flex flex-col bg-white px-4 py-8 sm:px-8">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="text-center text-sm text-slate-400">© {new Date().getFullYear()} MMC Hospital</p>
      </main>

      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex" aria-hidden>
        <div />
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Calm, connected care — from booking to pharmacy.
          </h2>
          <ul className="mt-8 space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-lg text-brand-50">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-brand-200" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <figure className="max-w-md rounded-2xl bg-white/10 p-6 ring-1 ring-inset ring-white/15">
          <blockquote className="text-base leading-relaxed text-brand-50">
            &ldquo;I knew exactly when to walk in. No crowded waiting room, no guessing.&rdquo;
          </blockquote>
          <figcaption className="mt-3 text-sm text-brand-200">— A patient at MMC Hospital</figcaption>
        </figure>
      </aside>
    </div>
  );
}
