"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { homeFor } from "@/lib/navigation";
import { Alert, Button, Checkbox, Input } from "@/components/ui";
import { errorMessage } from "@/lib/utils";

type Errors = Partial<Record<"name" | "email" | "phone" | "password" | "confirm" | "terms", string>>;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Please enter a valid email address.";
    if (form.phone.replace(/\D/g, "").length < 7) e.phone = "Please enter a valid phone number.";
    if (form.password.length < 8) e.password = "Use at least 8 characters.";
    if (form.confirm !== form.password) e.confirm = "Passwords don't match.";
    if (!terms) e.terms = "Please accept the terms to continue.";
    return e;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    try {
      const u = await register(form.email.trim(), form.phone.trim(), form.name.trim(), form.password);
      router.replace(homeFor(u));
    } catch (err) {
      setServerError(errorMessage(err, "We couldn't create your account. Please try again."));
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Create your account</h1>
      <p className="mt-2 text-base text-slate-600">
        Free for patients. Already have one?{" "}
        <Link href="/login" className="font-medium text-brand-700 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>

      {serverError && (
        <Alert tone="danger" className="mt-6">
          {serverError}
        </Alert>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <Input label="Full name" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
            required
          />
          <Input
            label="Phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
            error={errors.phone}
            placeholder="+1 555 000 0000"
            required
          />
        </div>
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          hint="At least 8 characters."
          required
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
          required
        />
        <div>
          <Checkbox
            checked={terms}
            onChange={(e) => {
              setTerms(e.target.checked);
              setErrors((er) => ({ ...er, terms: undefined }));
            }}
            label="I agree to the terms of service and privacy policy"
            description="Your health information is only shared with your care team."
          />
          {errors.terms && (
            <p className="mt-1.5 text-sm font-medium text-red-600" role="alert">
              {errors.terms}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Create account
        </Button>
      </form>
    </div>
  );
}
