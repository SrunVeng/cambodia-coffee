import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function LeaveGuard({
                                       open,
                                       title,
                                       hint,
                                       confirmLabel = "Confirm",
                                       cancelLabel = "Cancel",
                                       onConfirm,
                                       onCancel,
                                       danger = false,
                                       icon,
                                       ariaLabelledBy,
                                       ariaDescribedBy,
                                       closeOnBackdrop = true,
                                       initialFocus = "cancel",
                                       className = "",
                                       panelClassName = "",
                                   }) {
    const cancelBtnRef = useRef(null);
    const confirmBtnRef = useRef(null);
    const dialogRef = useRef(null);
    const previouslyFocusedRef = useRef(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const genId = useId();

    const titleId = ariaLabelledBy || `leaveguard-title-${genId}`;
    const descId = (hint && (ariaDescribedBy || `leaveguard-hint-${genId}`)) || undefined;
    const isBrowser = typeof document !== "undefined";

    // Body lock, focus trap + restore, ESC
    useEffect(() => {
        if (!isBrowser || !open) return;

        const body = document.body;
        const prevOverflow = body.style.overflow;
        body.style.overflow = "hidden";

        previouslyFocusedRef.current = document.activeElement || null;

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                if (!isConfirming) onCancel?.();
            } else if (e.key === "Tab") {
                const root = dialogRef.current;
                if (!root) return;
                const focusables = getFocusableEls(root);
                if (focusables.length === 0) return;

                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                const active = document.activeElement || null;

                if (e.shiftKey && active === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && active === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener("keydown", onKeyDown);

        requestAnimationFrame(() => {
            const target = initialFocus === "confirm" ? confirmBtnRef.current : cancelBtnRef.current;
            target?.focus?.();
        });

        return () => {
            body.style.overflow = prevOverflow;
            document.removeEventListener("keydown", onKeyDown);
            previouslyFocusedRef.current?.focus?.();
        };
    }, [open, isBrowser, initialFocus, onCancel, isConfirming]);

    if (!isBrowser) return null;

    const prefersReducedMotion =
        isBrowser &&
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const fade = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: prefersReducedMotion ? 0 : 0.14 },
    };

    const pop = {
        initial: { y: prefersReducedMotion ? 0 : 16, scale: prefersReducedMotion ? 1 : 0.98, opacity: 0 },
        animate: { y: 0, scale: 1, opacity: 1 },
        exit: { y: prefersReducedMotion ? 0 : -8, scale: prefersReducedMotion ? 1 : 0.98, opacity: 0 },
        transition: { duration: prefersReducedMotion ? 0 : 0.16, ease: "easeOut" },
    };

    const handleBackdrop = () => {
        if (!closeOnBackdrop || isConfirming) return;
        onCancel?.();
    };

    const handleConfirm = async () => {
        if (!onConfirm || isConfirming) return;
        try {
            const maybe = onConfirm();
            if (maybe && typeof maybe.then === "function") {
                setIsConfirming(true);
                await maybe;
            }
        } finally {
            setIsConfirming(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            {open ? (
                <div className={className}>
                    {/* Backdrop */}
                    <motion.div
                        aria-hidden="true"
                        className="fixed inset-0 z-[100] bg-black/45"
                        onClick={handleBackdrop}
                        {...fade}
                    />

                    {/* Dialog */}
                    <motion.div
                        role={danger ? "alertdialog" : "dialog"}
                        aria-modal="true"
                        aria-labelledby={titleId}
                        aria-describedby={descId}
                        className="fixed inset-0 z-[101] grid place-items-center p-3"
                        {...fade}
                    >
                        <motion.div
                            ref={dialogRef}
                            onClick={(e) => e.stopPropagation()}
                            className={[
                                // Mobile-first: compact, minimal panel
                                "w-full max-w-sm rounded-xl border bg-white shadow-md",
                                "border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700",
                                "ring-1 ring-black/5 dark:ring-white/5",
                                "outline-none",
                                panelClassName,
                            ].join(" ")}
                            {...pop}
                        >
                            {/* Header */}
                            <div className="px-4 pt-4 pb-2">
                                <div className="flex items-start gap-2.5">
                                    {icon ? (
                                        <div className={danger ? "mt-0.5 text-red-600" : "mt-0.5 text-neutral-700 dark:text-neutral-300"} aria-hidden="true">
                                            {icon}
                                        </div>
                                    ) : null}
                                    <div className="min-w-0">
                                        <h2
                                            id={titleId}
                                            className="text-sm font-medium text-neutral-900 dark:text-white leading-snug truncate"
                                        >
                                            {title}
                                        </h2>
                                        {hint ? (
                                            <p id={descId} className="mt-1 text-xs text-neutral-600 dark:text-neutral-300 leading-snug">
                                                {hint}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-4 pb-4 flex flex-wrap items-center justify-end gap-2 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
                                <button
                                    type="button"
                                    ref={cancelBtnRef}
                                    onClick={onCancel}
                                    disabled={isConfirming}
                                    className="inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium
                             text-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-600
                             bg-white/70 dark:bg-neutral-900/70 hover:bg-neutral-50 dark:hover:bg-neutral-800
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400
                             focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900
                             disabled:opacity-60"
                                >
                                    {cancelLabel}
                                </button>

                                <button
                                    type="button"
                                    ref={confirmBtnRef}
                                    onClick={handleConfirm}
                                    disabled={isConfirming}
                                    className={[
                                        "inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold focus:outline-none",
                                        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900 disabled:opacity-60",
                                        danger
                                            ? "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300"
                                            : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 focus-visible:ring-neutral-400",
                                    ].join(" ")}
                                >
                                    {isConfirming ? (
                                        <span className="inline-flex items-center gap-2">
                      <Spinner aria-label="Working…" />
                      <span>{confirmLabel}</span>
                    </span>
                                    ) : (
                                        confirmLabel
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            ) : null}
        </AnimatePresence>,
        document.body
    );
}

/* Helpers */

function getFocusableEls(root) {
    const candidates = root.querySelectorAll(
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
    return Array.from(candidates).filter((el) => !el.hasAttribute("inert") && !el.closest("[inert]"));
}

function Spinner(props) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            role="img"
            {...props}
            className={"animate-spin " + (props.className || "")}
        >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
    );
}
