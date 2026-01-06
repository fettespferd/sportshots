import { ReactNode } from "react";
import { Button } from "./button";
import Link from "next/link";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  suggestions?: string[];
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  suggestions,
}: EmptyStateProps) {
  const defaultIcon = (
    <svg
      className="h-16 w-16 text-zinc-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );

  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-white p-12 text-center shadow dark:bg-zinc-800">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700">
        {icon || defaultIcon}
      </div>

      <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>

      <p className="mb-6 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>

      {action && (
        <div className="mb-6">
          {action.href ? (
            <Link href={action.href}>
              <Button>{action.label}</Button>
            </Link>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Stattdessen könntest du:
          </p>
          <ul className="space-y-1 text-left text-sm text-zinc-600 dark:text-zinc-400">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Specific empty state variants
export function NoEventsFound() {
  return (
    <EmptyState
      icon={
        <svg
          className="h-16 w-16 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      }
      title="Keine Events gefunden"
      description="Leider konnten wir keine Events finden, die deinen Suchkriterien entsprechen."
      action={{
        label: "Filter zurücksetzen",
        onClick: () => window.location.reload(),
      }}
      suggestions={[
        "Versuche andere Suchbegriffe",
        "Ändere den Event-Typ Filter",
        "Durchsuche alle Events ohne Filter",
      ]}
    />
  );
}

export function NoPhotographersFound() {
  return (
    <EmptyState
      icon={
        <svg
          className="h-16 w-16 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      }
      title="Keine Fotografen gefunden"
      description="Keine Fotografen passen zu deinen Suchkriterien."
      action={{
        label: "Alle Fotografen anzeigen",
        onClick: () => window.location.reload(),
      }}
      suggestions={[
        "Versuche andere Suchbegriffe",
        "Ändere den Account-Typ Filter",
        "Suche nach Teams oder Einzelfotografen",
      ]}
    />
  );
}
