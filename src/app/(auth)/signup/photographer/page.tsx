"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PhotographerSignUpPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main signup - all users are now photographers
    router.replace("/signup");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-900">
      <div className="text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Weiterleitung zur Registrierung...</p>
      </div>
    </div>
  );
}
