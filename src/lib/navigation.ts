import {
  Activity,
  BookOpen,
  CalendarPlus,
  ClipboardList,
  FileText,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  ListOrdered,
  Package,
  Pill,
  ShieldCheck,
  Siren,
  Stethoscope,
  TestTubes,
  UserPlus,
  Users,
  KeyRound,
  Tv,
  Apple,
  type LucideIcon,
} from "lucide-react";
import type { RoleCode, User } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface Workspace {
  role: RoleCode;
  label: string;
  /** Short description shown on login + admin screens. */
  description: string;
  home: string;
  icon: LucideIcon;
  nav: NavItem[];
}

/**
 * Single source of truth for every role's workspace and sidebar.
 * Add a page here and it shows up in the sidebar automatically.
 */
export const WORKSPACES: Record<RoleCode, Workspace> = {
  PATIENT: {
    role: "PATIENT",
    label: "Patient",
    description: "Book visits, track your queue and keep your health record.",
    home: "/patient",
    icon: HeartPulse,
    nav: [
      { href: "/patient", label: "Overview", icon: LayoutDashboard },
      { href: "/patient/book", label: "Book appointment", icon: CalendarPlus },
      { href: "/patient/queue", label: "My appointments", icon: ListOrdered },
      { href: "/patient/vitals", label: "Health check", icon: Activity },
      { href: "/patient/records", label: "Health record", icon: FileText },
      { href: "/patient/prescriptions", label: "Visits & prescriptions", icon: Pill },
      { href: "/patient/lifestyle", label: "Diet & lifestyle", icon: Apple },
    ],
  },
  DOCTOR: {
    role: "DOCTOR",
    label: "Doctor",
    description: "See today's queue, consult patients and write prescriptions.",
    home: "/doctor",
    icon: Stethoscope,
    nav: [
      { href: "/doctor", label: "Today's queue", icon: ListOrdered },
      { href: "/doctor/alerts", label: "Critical alerts", icon: Siren },
    ],
  },
  COMPOUNDER: {
    role: "COMPOUNDER",
    label: "Reception",
    description: "Register walk-ins, approve bookings and manage the queue.",
    home: "/compounder",
    icon: ClipboardList,
    nav: [
      { href: "/compounder", label: "Live queue", icon: ListOrdered },
      { href: "/compounder/approvals", label: "Approvals", icon: ClipboardList },
      { href: "/compounder/walk-in", label: "Register walk-in", icon: UserPlus },
      { href: "/compounder/triage", label: "Vitals & triage", icon: Activity },
    ],
  },
  PHARMACIST: {
    role: "PHARMACIST",
    label: "Pharmacy",
    description: "Dispense prescriptions and manage medicine stock.",
    home: "/pharmacy",
    icon: Pill,
    nav: [
      { href: "/pharmacy", label: "Prescriptions", icon: FileText },
      { href: "/pharmacy/inventory", label: "Inventory", icon: Package },
    ],
  },
  LAB_ASSISTANT: {
    role: "LAB_ASSISTANT",
    label: "Laboratory",
    description: "Collect samples and publish test results.",
    home: "/lab",
    icon: FlaskConical,
    nav: [
      { href: "/lab", label: "Test orders", icon: TestTubes },
      { href: "/lab/catalog", label: "Test catalog", icon: BookOpen },
    ],
  },
  NURSE: {
    role: "NURSE",
    label: "Nursing",
    description: "Inpatient vitals, triage, queue management and emergency response.",
    home: "/nurse",
    icon: HeartPulse,
    nav: [
      { href: "/nurse", label: "Patient Care & Vitals", icon: Activity },
      { href: "/nurse/alerts", label: "Emergency Alerts", icon: Siren },
    ],
  },
  SUPER_ADMIN: {
    role: "SUPER_ADMIN",
    label: "Administration",
    description: "Manage staff, roles and permissions.",
    home: "/admin",
    icon: ShieldCheck,
    nav: [
      { href: "/admin", label: "Users", icon: Users },
      { href: "/admin/roles", label: "Roles & permissions", icon: KeyRound },
      { href: "/admin/emergency-teams", label: "Emergency Teams", icon: Siren },
    ],
  },
};

/** Links shown at the bottom of every sidebar. */
export const SHARED_NAV: NavItem[] = [
  // { href: "/tv", label: "Waiting room screen", icon: Tv },
  { href: "/guide", label: "Help & guide", icon: BookOpen },
];

export const ROLE_ORDER: RoleCode[] = ["PATIENT", "DOCTOR", "NURSE", "COMPOUNDER", "PHARMACIST", "LAB_ASSISTANT", "SUPER_ADMIN"];

export function userRoles(user: User | null): RoleCode[] {
  return (user?.roles?.map((r) => r.code).filter((c): c is RoleCode => c in WORKSPACES) ?? []) as RoleCode[];
}

/** Where a user should land after signing in. */
export function homeFor(user: User | null): string {
  const roles = userRoles(user);
  if (roles.includes("SUPER_ADMIN")) return WORKSPACES.SUPER_ADMIN.home;
  return roles.length ? WORKSPACES[roles[0]].home : "/patient";
}

/** Which workspace does a pathname belong to? */
export function workspaceForPath(pathname: string): Workspace | null {
  const seg = "/" + (pathname.split("/")[1] || "");
  return Object.values(WORKSPACES).find((w) => w.home === seg) ?? null;
}

/** Super admins can open every workspace; everyone else only their own. */
export function canAccess(user: User | null, ws: Workspace | null) {
  if (!ws) return true;
  const roles = userRoles(user);
  return roles.includes("SUPER_ADMIN") || roles.includes(ws.role);
}
