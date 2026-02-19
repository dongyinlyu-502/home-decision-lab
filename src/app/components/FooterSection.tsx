"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MessageSquare, Coffee, UserRound, X, Star, Send, Loader2, CheckCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FeedbackType = "Feature" | "Bug" | "Question" | "Other";

const FEEDBACK_TAGS: { label: FeedbackType; emoji: string }[] = [
    { label: "Feature", emoji: "💡" },
    { label: "Bug", emoji: "🐞" },
    { label: "Question", emoji: "💬" },
    { label: "Other", emoji: "✨" },
];

const RATING_LABELS: Record<number, string> = {
    1: "Needs Work 😥",
    2: "Could Be Better 😐",
    3: "Average 🙂",
    4: "Good 😊",
    5: "Excellent! 🌟",
};

// ─── Overlay wrapper ──────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

// ─── Feedback Modal ───────────────────────────────────────────────────────────

function FeedbackModal({ onClose }: { onClose: () => void }) {
    const [feedbackType, setFeedbackType] = useState<FeedbackType>("Feature");
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState("");
    const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async () => {
        if (!feedbackText.trim()) {
            setErrorMsg("Please share a message before submitting.");
            return;
        }
        setErrorMsg("");
        setStatus("sending");

        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    feedbackType,
                    rating,
                    ratingLabel: rating ? RATING_LABELS[rating] : "No rating",
                    feedbackText,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Submission failed");
            }

            setStatus("success");
            // Auto-close after showing success state
            setTimeout(onClose, 2000);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Submission failed";
            setErrorMsg(msg);
            setStatus("error");
        }
    };

    const displayRating = hoverRating || rating;

    // ── Success state ──────────────────────────────────────────────────────────
    if (status === "success") {
        return (
            <ModalOverlay onClose={onClose}>
                <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-slate-800">Thank you! 🙏</h3>
                        <p className="text-sm text-slate-500 mt-1">Your feedback has been sent to the author.</p>
                    </div>
                </div>
            </ModalOverlay>
        );
    }

    return (
        <ModalOverlay onClose={onClose}>
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Feedback</h2>
                        <p className="text-xs text-slate-500">Every piece of advice drives our progress.</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Tag selection */}
            <div className="mb-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">Category</p>
                <div className="flex flex-wrap gap-2">
                    {FEEDBACK_TAGS.map(({ label, emoji }) => (
                        <button
                            key={label}
                            onClick={() => setFeedbackType(label)}
                            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${feedbackType === label
                                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent shadow-sm shadow-indigo-200"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                                }`}
                        >
                            {emoji} {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Star Rating */}
            <div className="mb-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">Rating</p>
                <div className="flex items-center gap-1.5 mb-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform hover:scale-110 active:scale-95"
                        >
                            <Star
                                className={`w-7 h-7 transition-colors ${star <= displayRating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-200 fill-slate-200"
                                    }`}
                            />
                        </button>
                    ))}
                    {displayRating > 0 && (
                        <span className="ml-2 text-sm font-medium text-slate-600 animate-in fade-in duration-150">
                            {RATING_LABELS[displayRating]}
                        </span>
                    )}
                </div>
            </div>

            {/* Textarea */}
            <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">Your Message</p>
                <textarea
                    value={feedbackText}
                    onChange={(e) => { setFeedbackText(e.target.value); setErrorMsg(""); }}
                    placeholder="Please describe your issue or suggestion..."
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none transition-all"
                />
                {errorMsg && (
                    <p className="mt-1.5 text-xs text-rose-500">{errorMsg}</p>
                )}
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={status === "sending"}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
                {status === "sending" ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending…
                    </>
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        Submit Feedback
                    </>
                )}
            </button>
        </ModalOverlay>
    );
}

// ─── Support Modal ────────────────────────────────────────────────────────────

function SupportModal({ onClose }: { onClose: () => void }) {
    return (
        <ModalOverlay onClose={onClose}>
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                        <Coffee className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Buy Me a Coffee</h2>
                        <p className="text-xs text-slate-500">Support keeps this tool free & improving.</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-4 py-2">
                <div className="w-52 h-52 rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                    {/* PayPal QR Code */}
                    <img
                        src="/paypal-qr.jpg"
                        alt="PayPal QR Code"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">Scan to support via PayPal</p>
                    <p className="text-xs text-slate-500 mt-1">Thank you — it means the world! ☕</p>
                </div>
            </div>

            <button
                onClick={onClose}
                className="w-full mt-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
                Maybe later
            </button>
        </ModalOverlay>
    );
}

// ─── Footer Section (main export) ────────────────────────────────────────────

export function FooterSection() {
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

    return (
        <>
            <footer className="w-full border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/60 py-14">
                <div className="container max-w-[1600px] mx-auto px-4 flex flex-col items-center">

                    {/* Decorative badge */}
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-4 py-1.5 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Get in Touch
                    </div>

                    <h2 className="text-xl font-semibold text-slate-800 text-center mb-2">
                        We&apos;d love to hear from you
                    </h2>
                    <p className="text-sm text-slate-500 text-center mb-8 max-w-sm">
                        Whether you have a feature idea, found a bug, or just want to say thanks — every message is read.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        {/* Submit Feedback */}
                        <button
                            onClick={() => setIsFeedbackModalOpen(true)}
                            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Submit Feedback
                        </button>

                        {/* Support Project */}
                        <button
                            onClick={() => setIsSupportModalOpen(true)}
                            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold text-sm shadow-sm hover:shadow-md hover:border-amber-300 hover:text-amber-600 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Coffee className="w-4 h-4" />
                            Support the Project
                        </button>

                        {/* Contact Author */}
                        <a
                            href="https://www.linkedin.com/in/dongyin-lyu-dongyin/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold text-sm shadow-sm hover:shadow-md hover:border-sky-300 hover:text-sky-600 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <UserRound className="w-4 h-4" />
                            Contact Author
                        </a>
                    </div>

                    {/* Muted hint */}
                    <p className="text-xs text-slate-400">We typically reply within 24 hours.</p>

                    {/* Copyright */}
                    <div className="mt-10 pt-6 border-t border-slate-100 w-full max-w-sm text-center">
                        <p className="text-xs text-slate-400">
                            © {new Date().getFullYear()} Home Decision Lab ·{" "}
                            <Link
                                href="/privacy"
                                className="text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                Privacy
                            </Link>
                            {" "}· Built with ❤️ by{" "}
                            <a
                                href="https://www.linkedin.com/in/dongyin-lyu-dongyin/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-500 hover:underline"
                            >
                                Dongyin Lyu
                            </a>
                        </p>
                    </div>
                </div>
            </footer>

            {/* Modals */}
            {isFeedbackModalOpen && <FeedbackModal onClose={() => setIsFeedbackModalOpen(false)} />}
            {isSupportModalOpen && <SupportModal onClose={() => setIsSupportModalOpen(false)} />}
        </>
    );
}
