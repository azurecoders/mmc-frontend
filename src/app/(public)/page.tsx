import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BellRing,
  CalendarCheck,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { LinkButton } from "@/components/ui";

const features = [
  {
    icon: Sparkles,
    title: "Find the right doctor",
    text: "Describe how you feel and our AI suggests the right department and specialist — with fees and availability.",
  },
  {
    icon: Clock,
    title: "Live queue tracking",
    text: "See your token, how many people are ahead and your estimated wait — updated in real time on your phone.",
  },
  {
    icon: Activity,
    title: "Early warning checks",
    text: "Log your vitals at home. Readings are scored with clinical early-warning scales and your doctor is alerted if needed.",
  },
  {
    icon: Stethoscope,
    title: "Digital consultations",
    text: "Doctors record notes, prescriptions and lab tests in one place — sent instantly to pharmacy and lab.",
  },
  {
    icon: Pill,
    title: "Pharmacy, ready on time",
    text: "Prescriptions arrive at the pharmacy before you do. You're notified the moment your medicines are ready.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    text: "Role-based access means every team member sees exactly what they need — and nothing more.",
  },
];

const steps = [
  { title: "Tell us your symptoms", text: "A short form — no medical knowledge needed." },
  { title: "Choose your doctor", text: "Pick the AI recommendation or browse all specialists." },
  { title: "Get your token", text: "Track your turn live and arrive just in time." },
];

const teams = [
  { icon: HeartPulse, title: "Patients", text: "Booking, live queue, health record and prescriptions." },
  { icon: ClipboardList, title: "Reception", text: "Walk-ins, approvals, vitals triage and calling patients." },
  { icon: Stethoscope, title: "Doctors", text: "Today's queue, consultation notes and critical alerts." },
  { icon: Pill, title: "Pharmacy", text: "Prescription queue, dispensing and stock levels." },
  { icon: FlaskConical, title: "Laboratory", text: "Sample collection, results and abnormal-value flags." },
  { icon: ShieldCheck, title: "Administration", text: "Staff accounts, roles and permissions." },
];

function QueuePreview() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Dr. Sarah Smith · Cardiology</p>
            <p className="text-sm font-medium text-slate-900">Room 101</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-brand-600 p-4 text-white">
            <p className="text-sm text-brand-100">Your token</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums">14</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
            <p className="text-sm text-slate-500">Now serving</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums text-slate-900">11</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-200">
          <span className="text-sm text-slate-600">3 people ahead</span>
          <span className="text-sm font-medium text-slate-900">~ 18 min wait</span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-3/4 rounded-full bg-brand-600" />
        </div>
      </div>

      <div className="absolute -bottom-6 -left-4 hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <BellRing className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium text-slate-900">Your medicines are ready</p>
          <p className="text-xs text-slate-500">Pharmacy counter 2</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-slate-100 bg-slate-50/60">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-brand-700 ring-1 ring-inset ring-brand-200">
              <Sparkles className="h-4 w-4" aria-hidden />
              AI-assisted, real-time hospital care
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
              Hospital visits, without the waiting-room chaos.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Book the right doctor in minutes, track your turn live, and get prescriptions and lab results the moment
              they&apos;re ready — all in one simple place.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/register" size="lg">
                Book an appointment
                <ArrowRight className="h-5 w-5" aria-hidden />
              </LinkButton>
              <LinkButton href="/login" size="lg" variant="secondary">
                Sign in
              </LinkButton>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              {["No paperwork", "Live wait times", "Free for patients"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-600" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <QueuePreview />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-700">Features</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Everything a visit needs, connected.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From the first symptom to the last pill — every step updates instantly for you and the care team.
            </p>
          </div>
          <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li key={f.title}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <f.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-slate-600">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-slate-100 bg-slate-50/60 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-700">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Three steps to see a doctor.
            </h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-base text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <LinkButton href="/register" size="lg">
              <CalendarCheck className="h-5 w-5" aria-hidden />
              Get started — it&apos;s free
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Teams */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-brand-700">For hospital teams</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                A focused workspace for every role.
              </h2>
            </div>
            <Link href="/guide" className="inline-flex items-center gap-1.5 text-base font-medium text-brand-700 hover:text-brand-800">
              Read the guide
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <li key={t.title} className="flex gap-4 rounded-2xl border border-slate-200 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <t.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{t.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{t.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-6xl rounded-3xl bg-slate-900 px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Ready when you are.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
            Register as a patient to book your consultation, or sign in to your clinical or administrative workspace.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <LinkButton href="/register" size="lg">
              Register as Patient
            </LinkButton>
            <LinkButton href="/login" size="lg" variant="secondary">
              Sign In to Workspace
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
