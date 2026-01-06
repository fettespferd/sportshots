"use client";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthProps) {
  const getStrength = (password: string): {
    score: number;
    label: string;
    color: string;
  } => {
    if (!password) {
      return { score: 0, label: "", color: "" };
    }

    let score = 0;

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character variety checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    // Map score to strength
    if (score <= 2) {
      return { score: 1, label: "Schwach", color: "bg-red-500" };
    } else if (score <= 4) {
      return { score: 2, label: "Mittel", color: "bg-yellow-500" };
    } else {
      return { score: 3, label: "Stark", color: "bg-green-500" };
    }
  };

  const strength = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="mb-1 flex gap-2">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all ${
              level <= strength.score
                ? strength.color
                : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Passwortstärke: <span className="font-medium">{strength.label}</span>
      </p>
      <div className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        <p className={password.length >= 8 ? "text-green-600 dark:text-green-400" : ""}>
          {password.length >= 8 ? "✓" : "○"} Mindestens 8 Zeichen
        </p>
        <p className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
          {/[A-Z]/.test(password) && /[a-z]/.test(password) ? "✓" : "○"} Groß- und Kleinbuchstaben
        </p>
        <p className={/[0-9]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
          {/[0-9]/.test(password) ? "✓" : "○"} Mindestens eine Zahl
        </p>
        <p className={/[^a-zA-Z0-9]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
          {/[^a-zA-Z0-9]/.test(password) ? "✓" : "○"} Sonderzeichen (!@#$%^&*)
        </p>
      </div>
    </div>
  );
}
