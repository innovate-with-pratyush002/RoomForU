"use client";

import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from "lucide-react";
import type { User } from "@/types/listing";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmationText: string) => Promise<void>;
  user: User | null;
  listingsCount: number;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  listingsCount,
}: DeleteAccountModalProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state whenever modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationInput("");
      setErrorMessage(null);
      setIsDeleting(false);
      // Auto-focus input after modal transition
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const username = user?.username || (user?.email ? user.email.split("@")[0] : "");
  const expectedConfirmation = "DELETE";

  const isConfirmed =
    confirmationInput.trim().toUpperCase() === expectedConfirmation ||
    (username && confirmationInput.trim().toLowerCase() === username.toLowerCase());

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || isDeleting) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await onConfirm(confirmationInput.trim());
    } catch (err: any) {
      setIsDeleting(false);
      setErrorMessage(
        err?.message || "Failed to delete account. Please verify your connection and try again."
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop blur overlay */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isDeleting) onClose();
        }}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-6 shadow-[0_24px_60px_rgba(15,118,110,.14)] transition-all sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-700 sm:size-14">
            <Trash2 size={26} />
          </div>
          <div className="flex-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-teal-200/70 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800">
              <ShieldAlert size={12} className="text-teal-700" /> Irreversible Action
            </span>
            <h2
              id="delete-account-modal-title"
              className="mt-1.5 text-xl font-extrabold text-slate-900 sm:text-2xl"
            >
              Delete Account Permanently?
            </h2>
          </div>
        </div>

        {/* Warning Content */}
        <div className="mt-4 text-sm text-slate-600">
          <p>
            This action is <span className="font-bold text-teal-800">permanent and immediate</span>.
            All records and resources attached to your account will be deleted from our database:
          </p>

          <ul className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-[#f8f9fa] p-4 text-xs font-medium text-slate-700">
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-700">•</span>
              <span>
                <strong>{listingsCount}</strong> published room {listingsCount === 1 ? "listing" : "listings"} and all uploaded property photos.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-700">•</span>
              <span>All reviews, ratings, and feedback authored by you across the platform.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-700">•</span>
              <span>Your profile, account authentication credentials, and active sign-in sessions.</span>
            </li>
          </ul>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
            <AlertTriangle size={16} className="shrink-0 text-amber-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Confirmation Form */}
        <form onSubmit={handleDelete} className="mt-5">
          <label
            htmlFor="delete-confirm-input"
            className="block text-xs font-bold text-slate-700"
          >
            To confirm deletion, please type{" "}
            <span className="rounded-md border border-teal-200/80 bg-teal-50 px-1.5 py-0.5 font-mono font-bold text-teal-800">
              DELETE
            </span>
            {username && (
              <>
                {" "}or your username{" "}
                <span className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono font-bold text-slate-800">
                  {username}
                </span>
              </>
            )}:
          </label>
          <input
            id="delete-confirm-input"
            ref={inputRef}
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            disabled={isDeleting}
            placeholder="Type DELETE to confirm"
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition focus:border-[#0695a2] focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50"
          />

          {/* Modal Action Buttons */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-teal-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Deleting All Data...
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  Permanently Delete Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
