"use client";

import { useEffect } from "react";

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: {
    ctrl?: boolean;
    cmd?: boolean;
    shift?: boolean;
    alt?: boolean;
  } = {}
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { ctrl = false, cmd = false, shift = false, alt = false } = options;

      const ctrlPressed = ctrl && event.ctrlKey;
      const cmdPressed = cmd && (event.metaKey || event.ctrlKey); // Meta for Mac, Ctrl for Win
      const shiftPressed = shift && event.shiftKey;
      const altPressed = alt && event.altKey;

      // Check if the key matches
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();

      // Check if modifiers match
      const modifiersMatch =
        (ctrl ? ctrlPressed : !event.ctrlKey) &&
        (cmd ? cmdPressed : !(event.metaKey || (ctrl && event.ctrlKey))) &&
        (shift ? shiftPressed : !event.shiftKey) &&
        (alt ? altPressed : !event.altKey);

      if (keyMatches && (ctrl || cmd || shift || alt ? (ctrlPressed || cmdPressed || shiftPressed || altPressed) : modifiersMatch)) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, callback, options]);
}
