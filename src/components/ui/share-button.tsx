"use client";

import { useState } from "react";

interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
  imageUrl?: string;
  className?: string;
  variant?: "button" | "icon";
}

export function ShareButton({
  url,
  title,
  text,
  imageUrl,
  className = "",
  variant = "button",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Check if Web Share API is available (mainly mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: text || title,
          url,
        });
      } catch (error) {
        console.log("Share cancelled or failed:", error);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleShare}
        className={`rounded-full transition-all ${className}`}
        title="Teilen"
      >
        {copied ? (
          <svg
            className="h-6 w-6 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl active:scale-95 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 ${className}`}
    >
      {copied ? (
        <>
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Link kopiert!</span>
        </>
      ) : (
        <>
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span>Teilen</span>
        </>
      )}
    </button>
  );
}

