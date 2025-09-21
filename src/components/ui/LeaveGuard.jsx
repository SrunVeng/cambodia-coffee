import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useTranslation } from "react-i18next";

// ---------- Utils ----------
function getFocusable(root) {
    if (!root) return [];
    const nodes = root.querySelectorAll(
        [
            "a[href]",
            "area[href]",
            "input:not([disabled]):not([type='hidden'])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            "button:not([disabled])",
            "iframe",
            "audio[controls]",
            "video[controls]",
            "[contenteditable]",
            "[tabindex]:not([tabindex='-1'])",
        ].join(",")
    );
    return Array.from(nodes).filter(
        (el) => !el.hasAttribute("inert") && !el.closest("[inert]")
    );
}

function Spinner({ className = "" }) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            role="img"
            aria-label="Loading"
            className={`${className} motion-safe:animate-spin`}
        >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
    );
}

// ---------- Component ----------
const LeaveGuard = React.memo(function LeaveGuard({
                                                      open,
                                                      title,
                                                      hint,
                                                      confirmLabel,
                                                      cancelLabel,
                                                      onConfirm,
                                                      onCancel,
                                                      tone = "brand",
                                                      size = "md",
                                                      icon,
                                                      closeOnBackdrop = true,
                                                      initialFocus = "cancel",
                                                      mountId,
                                                  }) {
    const { t } = useTranslation();
    const id = useId();

    const dialogRef = useRef(null);
    const cancelRef = useRef(null);
    const confirmRef = useRef(null);
    const previouslyFocused = useRef(null);
    const onCancelRef = useRef(onCancel);
    const onConfirmRef = useRef(onConfirm);

    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => { onCancelRef.current = onCancel; }, [onCancel]);
    useEffect(() => { onConfirmRef.current = onConfirm; }, [onConfirm]);

    const titleId = `lg-title-${id}`;
    const descId = hint ? `lg-desc-${id}` : undefined;

    const prefersReducedMotion = useMemo(() => {
        if (typeof window === "undefined" || !window.matchMedia) return false;
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);

    const overlayVariants = useMemo(() => ({
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: prefersReducedMotion ? 0 : 0.14 } },
        exit:    { opacity: 0, transition: { duration: prefersReducedMotion ? 0 : 0.12 } },
    }), [prefersReducedMotion]);

    const panelVariants = useMemo(() => ({
        initial: { y: prefersReducedMotion ? 0 : 18, scale: prefersReducedMotion ? 1 : 0.985, opacity: 0 },
        animate: { y: 0, scale: 1, opacity: 1, transition: { duration: prefersReducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] } },
        exit:    { y: prefersReducedMotion ? 0 : -8, scale: prefersReducedMotion ? 1 : 0.99, opacity: 0, transition: { duration: prefersReducedMotion ? 0 : 0.16, ease: [0.4, 0, 1, 1] } },
    }), [prefersReducedMotion]);

    // Body lock + focus trap
    useEffect(() => {
        if (!open || typeof document === "undefined") return;

        const body = document.body;
        const prevOverflow = body.style.overflow;
        body.style.overflow = "hidden";
        previouslyFocused.current = document.activeElement || null;

        const handleKey = (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                if (!isConfirming) onCancelRef.current?.();
            }
            if (e.key === "Tab") {
                const focusables = getFocusable(dialogRef.current);
                if (!focusables.length) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                const active = document.activeElement;
                if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
            }
        };

        document.addEventListener("keydown", handleKey, { capture: true });

        const raf = requestAnimationFrame(() => {
            const target = initialFocus === "confirm" ? confirmRef.current : cancelRef.current;
            target?.focus?.();
        });

        return () => {
            body.style.overflow = prevOverflow;
            document.removeEventListener("keydown", handleKey, { capture: true });
            cancelAnimationFrame(raf);
            previouslyFocused.current?.focus?.();
        };
    }, [open, initialFocus, isConfirming]);

    const handleBackdrop = () => {
        if (!closeOnBackdrop || isConfirming) return;
        onCancelRef.current?.();
    };

    const handleConfirm = async () => {
        if (!onConfirmRef.current || isConfirming) return;
        try {
            const ret = onConfirmRef.current();
            if (ret && typeof ret.then === "function") {
                setIsConfirming(true);
                await ret;
            }
        } finally {
            setIsConfirming(false);
        }
    };

    // theme (fixed: avoid self-reference)
    const TONES = {
        brand: {
            headIcon: "text-amber-700 dark:text-amber-300",
            confirm:
                "bg-[#6b4226] text-[#fffaf3] hover:bg-[#59361f] focus-visible:ring-[#b48b60] " +
                "dark:bg-[#d7c4a3] dark:text-[#2b211c] dark:hover:bg-[#c6af8e]",
        },
        neutral: {
            headIcon: "text-stone-600 dark:text-stone-300",
            confirm:
                "bg-stone-800 text-stone-50 hover:bg-stone-900 focus-visible:ring-stone-400 " +
                "dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-stone-300",
        },
        danger: {
            headIcon: "text-red-700 dark:text-red-400",
            confirm:
                "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-400 " +
                "dark:bg-red-500 dark:hover:bg-red-600",
        },
    };
    const tones = TONES[tone] || TONES.brand;

    const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

    const mountTarget =
        (typeof document !== "undefined" && mountId && document.getElementById(mountId)) ||
        (typeof document !== "undefined" && document.getElementById("modal-root")) ||
        (typeof document !== "undefined" && document.body);

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {open ? (
                // z-index raised so it always sits above SearchableSelect menus
                <div className="fixed inset-0 z-[10000]">
                    {/* Backdrop */}
                    <motion.div
                        aria-hidden="true"
                        className="absolute inset-0 bg-[rgba(28,20,15,0.58)] backdrop-blur-[1.5px]"
                        onClick={handleBackdrop}
                        {...overlayVariants}
                    />

                    {/* Panel */}
                    <div role="presentation" className="absolute inset-0 grid place-items-center p-4 sm:p-6">
                        <motion.div
                            ref={dialogRef}
                            role={tone === "danger" ? "alertdialog" : "dialog"}
                            aria-modal="true"
                            aria-labelledby={titleId}
                            aria-describedby={descId}
                            className={[
                                "w-full", sizes[size],
                                "rounded-xl shadow-2xl border",
                                "border-[rgba(80,56,40,0.18)]",
                                "bg-[#fdf7ef] dark:bg-[#241a15]",
                                "ring-1 ring-[rgba(60,44,33,0.12)]",
                                "outline-none",
                            ].join(" ")}
                            {...panelVariants}
                        >
                            {/* Header */}
                            <div className="flex items-start gap-3 px-5 pt-5 pb-3 border-b border-[rgba(78,54,42,0.14)]">
                                <div className={`shrink-0 mt-0.5 ${tones.headIcon}`}>
                                    {icon ?? <AlertTriangle className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 id={titleId} className="text-lg font-semibold leading-snug text-[#35261c] dark:text-[#eadfce]">
                                        {title}
                                    </h2>
                                    {hint ? (
                                        <p id={descId} className="mt-1 text-sm leading-relaxed text-[#5b4638] dark:text-[#cdbfae]">
                                            {hint}
                                        </p>
                                    ) : null}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onCancelRef.current?.()}
                                    className="p-2 -m-2 rounded-md text-[#6b5647] hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b48b60]
                             dark:text-[#dccdb9] dark:hover:bg-white/5"
                                    aria-label={t("common.close", { defaultValue: "Close" })}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-4 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
                                <button
                                    type="button"
                                    ref={cancelRef}
                                    onClick={() => onCancelRef.current?.()}
                                    disabled={isConfirming}
                                    className="inline-flex h-10 items-center gap-2 justify-center rounded-md px-4 text-sm font-medium
                             text-[#4e3a2e] border border-[rgba(78,54,42,0.28)]
                             bg-[#fffbf5] hover:bg-[#f3e8db]
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b48b60] disabled:opacity-60
                             dark:text-[#eadfce] dark:bg-[#2d211b] dark:hover:bg-[#3a2c23]"
                                >
                                    <X className="w-4 h-4" />
                                    {cancelLabel || t("common.cancel", { defaultValue: "Cancel" })}
                                </button>

                                <button
                                    type="button"
                                    ref={confirmRef}
                                    onClick={handleConfirm}
                                    disabled={isConfirming}
                                    className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold
                              focus:outline-none focus-visible:ring-2 disabled:opacity-60 ${tones.confirm}`}
                                >
                                    {isConfirming ? (
                                        <span className="inline-flex items-center gap-2">
                      <Spinner />
                      <span>{confirmLabel || t("common.confirm", { defaultValue: "Confirm" })}</span>
                    </span>
                                    ) : (
                                        confirmLabel || t("common.confirm", { defaultValue: "Confirm" })
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            ) : null}
        </AnimatePresence>,
        mountTarget
    );
});

export default LeaveGuard;
