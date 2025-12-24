"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  type?: "success" | "error" | "warning" | "info";
  onClose?: () => void;
  duration?: number;
}

export default function Toast({ message, type = "info", onClose, duration = 3500 }: ToastProps) {
  useEffect(() => {
    if (onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  const colors = {
    success: "bg-emerald-600 border-emerald-500 text-white",
    error: "bg-red-600 border-red-500 text-white",
    warning: "bg-amber-600 border-amber-500 text-white",
    info: "bg-blue-600 border-blue-500 text-white",
  };

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  if (!message) return null;

  return (
    <div className={`fixed right-4 bottom-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm animate-slide-up ${colors[type]}`}>
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 hover:opacity-70 transition-opacity"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

