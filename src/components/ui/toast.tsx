"use client";

import { useEffect } from "react";

interface ToastProps {
  show: boolean;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
  onClose: () => void;
}

export function Toast({ show, type, message, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const bgColor = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
    warning: "bg-yellow-600",
  }[type];

  const icon = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  }[type];

  return (
    <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
      <div className={`rounded-lg px-6 py-4 shadow-lg text-white ${bgColor}`}>
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className="font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
}

