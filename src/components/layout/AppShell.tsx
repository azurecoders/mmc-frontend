"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  WORKSPACES,
  SHARED_NAV,
  userRoles,
  workspaceForPath,
  canAccess,
  homeFor,
  type NavItem,
  type Workspace,
} from "@/lib/navigation";
import { useSocketStatus } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Avatar, Badge, LinkButton, LoadingState, EmptyState } from "@/components/ui";
import { Logo } from "./Logo";
import { EmergencyAlertBanner } from "@/components/emergency/EmergencyAlertBanner";

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
        active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600")} aria-hidden />
      {item.label}
    </Link>
  );
}

function UserCard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;
  const roles = userRoles(user);
  const primaryRoleCode = roles[0] || "PATIENT";
  const roleLabel = WORKSPACES[primaryRoleCode]?.label || "Member";

  const onSignOut = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="flex items-center gap-3">
        <Avatar name={user.full_name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{user.full_name}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Badge tone="brand">
              {roleLabel}
            </Badge>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-2.5 border-t border-slate-200/80">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:text-red-600 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  );
}

function primaryWorkspace(roles: string[]): Workspace {
  if (roles.includes("SUPER_ADMIN")) return WORKSPACES.SUPER_ADMIN;
  if (roles.includes("DOCTOR")) return WORKSPACES.DOCTOR;
  if (roles.includes("NURSE")) return WORKSPACES.NURSE;
  if (roles.includes("COMPOUNDER")) return WORKSPACES.COMPOUNDER;
  if (roles.includes("PHARMACIST")) return WORKSPACES.PHARMACIST;
  if (roles.includes("LAB_ASSISTANT")) return WORKSPACES.LAB_ASSISTANT;
  return WORKSPACES.PATIENT;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const connected = useSocketStatus();
  const roles = userRoles(user);
  const ws = primaryWorkspace(roles);

  const isActive = (href: string) => {
    return href === ws.home ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5 border-b border-slate-100">
        <Logo href={homeFor(user)} />
      </div>

      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {/* Strictly isolated workspace for the logged in user */}
        <div>
          <div className="mb-2 px-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {ws.label}
            </span>
          </div>
          <div className="space-y-0.5">
            {ws.nav.map((item) => (
              <NavLink key={item.href} item={item} active={!!isActive(item.href)} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        <div className="space-y-0.5 border-t border-slate-100 pt-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Hospital
          </p>
          {SHARED_NAV.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="shrink-0 space-y-2 border-t border-slate-200 p-3 bg-white">
        <p className="flex items-center gap-2 px-2 text-xs text-slate-500" role="status">
          <span className={cn("h-2 w-2 rounded-full", connected ? "bg-emerald-500" : "bg-slate-300")} aria-hidden />
          {connected ? "Connected (Realtime)" : "Connecting..."}
        </p>
        <UserCard />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const ws = workspaceForPath(pathname);

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, pathname, router]);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Loading your workspace…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <Logo href={homeFor(user)} />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="-mr-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3.5 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main id="main" className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <EmergencyAlertBanner />
          {canAccess(user, ws) ? (
            children
          ) : (
            <EmptyState
              icon={ShieldAlert}
              title="You don't have access to this area"
              description={`This page is for the ${ws?.label ?? ""} team. You can return to your own workspace.`}
              action={<LinkButton href={homeFor(user)}>Go to my workspace</LinkButton>}
            />
          )}
        </div>
      </main>
    </div>
  );
}
