"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { homeFor } from "@/lib/navigation";
import { LinkButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/guide", label: "Help guide" },
  { href: "/tv", label: "Waiting room screen" },
];

export function PublicHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === l.href ? "text-brand-700" : "text-slate-600 hover:text-slate-900"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <LinkButton href={homeFor(user)}>Open my workspace</LinkButton>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost">
                Sign in
              </LinkButton>
              <LinkButton href="/register">Create account</LinkButton>
            </>
          )}
        </div>

        <button
          type="button"
          className="-mr-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="space-y-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-50">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4">
            {user ? (
              <LinkButton href={homeFor(user)} size="lg">
                Open my workspace
              </LinkButton>
            ) : (
              <>
                <LinkButton href="/register" size="lg">
                  Create account
                </LinkButton>
                <LinkButton href="/login" variant="secondary" size="lg">
                  Sign in
                </LinkButton>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-slate-500">Calm, connected care — from booking to pharmacy.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          <Link href="/guide" className="hover:text-slate-900">Help guide</Link>
          <Link href="/login" className="hover:text-slate-900">Sign in</Link>
          <Link href="/register" className="hover:text-slate-900">Create account</Link>
          <Link href="/tv" className="hover:text-slate-900">Waiting room screen</Link>
        </nav>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} ApexCare Hospital
      </div>
    </footer>
  );
}
