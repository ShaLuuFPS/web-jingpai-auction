"use client";

import { useState, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ConfirmButtonProps {
  children: ReactNode;
  title: string;
  description?: string;
  confirmText?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  /** Called on confirm for non-form actions. If omitted, submits the closest parent <form>. */
  onConfirm?: () => void;
  /** Optional guard — runs before opening the dialog. Return false to block. */
  guard?: () => boolean;
}

export default function ConfirmButton({
  children,
  title,
  description,
  confirmText = "确认",
  variant = "danger",
  loading = false,
  disabled = false,
  className = "",
  onConfirm,
  guard,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const confirmBtnClass =
    variant === "danger"
      ? "bg-[#ff6b6b] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-[#e55] disabled:opacity-50"
      : "bg-[#635bff] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-[#0a2540] disabled:opacity-50";

  const handleConfirm = () => {
    setOpen(false);
    if (onConfirm) {
      onConfirm();
    } else {
      // Find the closest parent form and submit it
      formRef.current?.requestSubmit();
    }
  };

  return (
    <>
      {/* Trigger button — stores ref to parent form on mount */}
      <button
        ref={(el) => {
          if (el) {
            formRef.current = el.closest("form");
          }
        }}
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          if (guard && !guard()) return;
          setOpen(true);
        }}
        className={className}
      >
        {children}
      </button>

      {/* Modal rendered to body so it always sits above all page content */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center">
            {/* Backdrop — catches all pointer events, blocks interaction with page */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Dialog card */}
            <div
              className="relative bg-white rounded-2xl border border-gray-100 p-6 mx-4 max-w-sm w-full animate-modal-in"
              style={{
                boxShadow:
                  "0 50px 100px -20px rgba(50,50,93,0.15), 0 30px 60px -30px rgba(0,0,0,0.1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center
              bg-red-50"
              >
                <svg
                  className="w-6 h-6 text-[#ff6b6b]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                {title}
              </h3>

              {/* Description */}
              {description && (
                <p className="text-sm text-gray-500 text-center mb-6">
                  {description}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-150 hover:border-[#635bff] hover:text-[#635bff]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={confirmBtnClass}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
