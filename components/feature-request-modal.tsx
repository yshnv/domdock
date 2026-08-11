"use client";

import { useState } from "react";
import { CheckCircle2, Lightbulb, Loader2, MessageSquarePlus, X } from "lucide-react";

export function FeatureRequestModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Domain Monitoring");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feature-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          description,
          email
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit feature request");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setTitle("");
    setDescription("");
    setEmail("");
    setSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[20px] border border-[#3139fb]/20 bg-[#fffcec] p-6 shadow-2xl arc-shadow-elevated dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3139fb]/15 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-[10px] bg-[#3139fb] text-white shadow-sm">
              <Lightbulb className="size-4" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-[#3139fb] dark:text-blue-400">
                Request a Feature
              </h3>
              <p className="text-xs text-[#3139fb]/70 dark:text-slate-400">
                Help us shape the future of DomDock
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="rounded-[8px] p-1.5 text-[#3139fb]/60 hover:bg-[#fffadd] hover:text-[#3139fb] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-6" />
            </div>
            <h4 className="mt-4 font-heading text-lg font-bold text-[#3139fb] dark:text-white">
              Request Received!
            </h4>
            <p className="mt-1 text-xs text-[#3139fb]/80 dark:text-slate-300">
              Thank you for your feedback. We review all feature ideas to improve DomDock.
            </p>
            <button
              onClick={resetAndClose}
              className="mt-6 rounded-[8px] bg-[#3139fb] px-5 py-2 font-body text-xs font-bold text-white shadow-sm hover:bg-[#3139fb]/90 transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block font-mono text-[11px] font-bold text-[#3139fb]/80 dark:text-slate-300">
                FEATURE TITLE *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Slack notifications for SSL expiration"
                className="w-full rounded-[8px] border border-[#3139fb]/20 bg-white px-3 py-2 text-xs font-medium text-[#3139fb] placeholder-[#3139fb]/40 outline-none focus:border-[#3139fb] focus:ring-1 focus:ring-[#3139fb] dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[11px] font-bold text-[#3139fb]/80 dark:text-slate-300">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-[8px] border border-[#3139fb]/20 bg-white px-3 py-2 text-xs font-medium text-[#3139fb] outline-none focus:border-[#3139fb] focus:ring-1 focus:ring-[#3139fb] dark:bg-slate-800 dark:text-white"
              >
                <option value="Domain Monitoring">Domain Monitoring</option>
                <option value="DNS & SSL">DNS & SSL Tracking</option>
                <option value="Integrations & Alerts">Integrations & Alerts</option>
                <option value="UI & UX">UI & UX Improvements</option>
                <option value="Other">Other Idea</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[11px] font-bold text-[#3139fb]/80 dark:text-slate-300">
                DESCRIPTION *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you'd like to see and why it would be helpful..."
                className="w-full rounded-[8px] border border-[#3139fb]/20 bg-white px-3 py-2 text-xs font-medium text-[#3139fb] placeholder-[#3139fb]/40 outline-none focus:border-[#3139fb] focus:ring-1 focus:ring-[#3139fb] dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[11px] font-bold text-[#3139fb]/80 dark:text-slate-300">
                YOUR EMAIL (OPTIONAL)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com (so we can follow up)"
                className="w-full rounded-[8px] border border-[#3139fb]/20 bg-white px-3 py-2 text-xs font-medium text-[#3139fb] placeholder-[#3139fb]/40 outline-none focus:border-[#3139fb] focus:ring-1 focus:ring-[#3139fb] dark:bg-slate-800 dark:text-white"
              />
            </div>

            {error && (
              <p className="font-mono text-xs text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-[8px] border border-[#3139fb]/20 bg-white px-4 py-2 text-xs font-semibold text-[#3139fb] hover:bg-[#fffadd] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#3139fb] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#3139fb]/90 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <MessageSquarePlus className="size-3.5" />
                    <span>Submit Feature Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
