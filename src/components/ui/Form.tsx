"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

const controlBase =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm " +
  "placeholder:text-slate-400 transition-colors " +
  "focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100 " +
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 " +
  "aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-100";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
  /** Visually hide the label (still read by screen readers). */
  hideLabel?: boolean;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean; required?: boolean }) => React.ReactNode;
}

/** Wraps any control with an accessible label, hint and error message. */
export function Field({ label, hint, error, required, className, hideLabel, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className={cn("block text-sm font-medium text-slate-700", hideLabel && "sr-only")}>
        {label}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden>
            *
          </span>
        )}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, required })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type BaseFieldProps = {
  label: string;
  hint?: string;
  error?: string | null;
  hideLabel?: boolean;
  containerClassName?: string;
};

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & BaseFieldProps;

export function Input({ label, hint, error, hideLabel, containerClassName, className, required, ...props }: InputProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} hideLabel={hideLabel} className={containerClassName}>
      {(a11y) => <input {...a11y} {...props} className={cn(controlBase, "h-10", className)} />}
    </Field>
  );
}

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & BaseFieldProps;

export function Textarea({ label, hint, error, hideLabel, containerClassName, className, required, rows = 3, ...props }: TextareaProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} hideLabel={hideLabel} className={containerClassName}>
      {(a11y) => <textarea {...a11y} rows={rows} {...props} className={cn(controlBase, "py-2.5 leading-relaxed", className)} />}
    </Field>
  );
}

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> &
  BaseFieldProps & {
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
  };

export function Select({ label, hint, error, hideLabel, containerClassName, className, required, options, placeholder, ...props }: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} hideLabel={hideLabel} className={containerClassName}>
      {(a11y) => (
        <select {...a11y} {...props} className={cn(controlBase, "h-10 pr-8", className)}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  description?: string;
}

export function Checkbox({ label, description, className, ...props }: CheckboxProps) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-brand-600"
        aria-describedby={description ? `${id}-d` : undefined}
        {...props}
      />
      <div className="text-sm">
        <label htmlFor={id} className="font-medium text-slate-700">
          {label}
        </label>
        {description && (
          <p id={`${id}-d`} className="text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
