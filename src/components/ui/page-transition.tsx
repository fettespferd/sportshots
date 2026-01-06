"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={`transition-opacity duration-300 ${
        isAnimating ? "opacity-0" : "opacity-100"
      }`}
    >
      {children}
    </div>
  );
}

// Fade In Animation Component
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, duration = 500, className = "" }: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

// Stagger Children Animation
interface StaggerChildrenProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerChildren({ children, staggerDelay = 50, className = "" }: StaggerChildrenProps) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <FadeIn key={index} delay={index * staggerDelay}>
              {child}
            </FadeIn>
          ))
        : children}
    </div>
  );
}

// Scale In Animation
interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, className = "" }: ScaleInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-300 ${
        isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// Slide In Animation
interface SlideInProps {
  children: ReactNode;
  direction?: "left" | "right" | "top" | "bottom";
  delay?: number;
  className?: string;
}

export function SlideIn({
  children,
  direction = "bottom",
  delay = 0,
  className = "",
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getTransform = () => {
    if (isVisible) return "translate-x-0 translate-y-0";

    switch (direction) {
      case "left":
        return "-translate-x-4";
      case "right":
        return "translate-x-4";
      case "top":
        return "-translate-y-4";
      case "bottom":
        return "translate-y-4";
    }
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${getTransform()} ${className}`}
    >
      {children}
    </div>
  );
}
