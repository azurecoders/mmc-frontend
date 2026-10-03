"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { homeFor } from "@/lib/navigation";
import { Alert, Button, Input } from "@/components/ui";
import { errorMessage } from "@/lib/utils";
import type { User } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goHome = (u: User | null) => {
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next && next.startsWith("/") ? next : homeFor(u));
  };

  // Already signed in? Skip the form.
  useEffect(() => {
    if (!loading && user) goHome(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email (or phone) and password.");
      return;
    }
    setSubmitting(true);
    try {
      goHome(await login(email.trim(), password));
    } catch (err) {
      setError(errorMessage(err, "Incorrect email or password."));
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-2 text-base text-slate-600">
        Sign in to your account.{" "}
        <span className="whitespace-nowrap">
          New here?{" "}
          <Link href="/register" className="font-medium text-brand-700 underline-offset-4 hover:underline">
            Create an account
          </Link>
        </span>
      </p>

      {error && (
        <Alert tone="danger" className="mt-6">
          {error}
        </Alert>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <Input
          label="Email or phone"
          type="text"
          inputMode="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Sign in
        </Button>
      </form>
    </div>
  );
}
