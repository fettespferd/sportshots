"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  validate?: (value: string) => string | undefined;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, label, error, hint, validate, onChange, onBlur, ...props }, ref) => {
    const [touched, setTouched] = useState(false);
    const [validationError, setValidationError] = useState<string>();

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      if (validate) {
        const error = validate(e.target.value);
        setValidationError(error);
      }
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (touched && validate) {
        const error = validate(e.target.value);
        setValidationError(error);
      }
      onChange?.(e);
    };

    const displayError = error || (touched ? validationError : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
            {props.required && <span className="ml-1 text-red-600">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "block w-full rounded-md border bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:ring-offset-zinc-900",
            displayError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-300 focus:border-blue-500 dark:border-zinc-600",
            className
          )}
          aria-invalid={!!displayError}
          aria-describedby={
            displayError
              ? `${props.id}-error`
              : hint
              ? `${props.id}-hint`
              : undefined
          }
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        />
        {hint && !displayError && (
          <p
            id={`${props.id}-hint`}
            className="mt-1 text-xs text-zinc-600 dark:text-zinc-400"
          >
            {hint}
          </p>
        )}
        {displayError && (
          <p
            id={`${props.id}-error`}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {displayError}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

// Common validation functions
export const validators = {
  email: (value: string) => {
    if (!value) return "E-Mail ist erforderlich";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Bitte gib eine gültige E-Mail-Adresse ein (z.B. name@beispiel.de)";
    }
    return undefined;
  },
  required: (fieldName: string) => (value: string) => {
    if (!value || value.trim() === "") {
      return `${fieldName} ist erforderlich`;
    }
    return undefined;
  },
  minLength: (min: number) => (value: string) => {
    if (value && value.length < min) {
      return `Mindestens ${min} Zeichen erforderlich`;
    }
    return undefined;
  },
  maxLength: (max: number) => (value: string) => {
    if (value && value.length > max) {
      return `Maximal ${max} Zeichen erlaubt`;
    }
    return undefined;
  },
  url: (value: string) => {
    if (!value) return undefined;
    try {
      new URL(value);
      return undefined;
    } catch {
      return "Bitte gib eine gültige URL ein (z.B. https://beispiel.de)";
    }
  },
};
