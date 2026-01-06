"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export function Tooltip({
  children,
  content,
  position = "top",
  delay = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipOffset = 8;

    let x = 0;
    let y = 0;

    switch (position) {
      case "top":
        x = rect.left + rect.width / 2;
        y = rect.top - tooltipOffset;
        break;
      case "bottom":
        x = rect.left + rect.width / 2;
        y = rect.bottom + tooltipOffset;
        break;
      case "left":
        x = rect.left - tooltipOffset;
        y = rect.top + rect.height / 2;
        break;
      case "right":
        x = rect.right + tooltipOffset;
        y = rect.top + rect.height / 2;
        break;
    }

    setCoords({ x, y });
  };

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isVisible) return;

    const handleUpdate = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isVisible]);

  const getTooltipStyle = () => {
    const baseStyle: React.CSSProperties = {
      position: "fixed",
      zIndex: 9999,
      pointerEvents: "none",
    };

    switch (position) {
      case "top":
        return {
          ...baseStyle,
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          ...baseStyle,
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          transform: "translate(-50%, 0)",
        };
      case "left":
        return {
          ...baseStyle,
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          ...baseStyle,
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          transform: "translate(0, -50%)",
        };
    }
  };

  const getArrowStyle = () => {
    switch (position) {
      case "top":
        return "bottom-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent";
      case "bottom":
        return "top-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent";
      case "left":
        return "right-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent";
      case "right":
        return "left-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent";
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className="inline-flex"
      >
        {children}
      </div>

      {mounted &&
        isVisible &&
        createPortal(
          <div
            style={getTooltipStyle()}
            className="animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="relative rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-zinc-700">
              {content}
              <div
                className={`absolute h-0 w-0 border-4 border-zinc-900 dark:border-zinc-700 ${getArrowStyle()}`}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
