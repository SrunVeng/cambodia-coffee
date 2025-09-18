import React, { useEffect, useId, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useTranslation } from "react-i18next";

// ---------- Helpers ----------
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
    return Array.from(candidates).filter(
        (el) => !el.hasAttribute("inert") && !el.closest("[inert]")
    );
}

function Spinner(props) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            role="img"
            {...props}
            className={(props.className ? props.className + " " : "") + "motion-safe:animate-spin"}
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
                                                      danger = false,
                                                      icon,
                                                      ariaLabelledBy,
                                                      ariaDescribedBy,
                                                      closeOnBackdrop = true,
                                                      initialFocus = "cancel",
                                                      className = "",
                                                      panelClassName = "",
                                                      backdropBlur = false, // NEW: heavy on low-end devices; default off
                                                  }) {
    const { t } = useTranslation();
    const cancelBtnRef = useRef(null);
    const confirmBtnRef = useRef(null);
    const dialogRef = useRef(null);
    const previouslyFocusedRef = useRef(null);
    const isConfirmingRef = useRef(false);
    const onCancelRef = useRef(onCancel);
    const onConfirmRef = useRef(onConfirm);
    const [isConfirming, setIsConfirming] = useState(false);
    const genId = useId();

    // keep refs in sync without re-subscribing effects
    useEffect(() => { onCancelRef.current = onCancel; }, [onCancel]);
    useEffect(() => { onConfirmRef.current = onConfirm; }, [onConfirm]);
    useEffect(() => { isConfirmingRef.current = isConfirming; }, [isConfirming]);

    const titleId = ariaLabelledBy || `leaveguard-title-${genId}`;
    const descId = hint ? (ariaDescribedBy || `leaveguard-hint-${genId}`) : undefined;
    const isBrowser = typeof document !== "undefined";

    const fallback = { confirm: "Confirm", cancel: "Cancel" };

    // PRM check memoized (no re-run per render)
    const prefersReducedMotion = useMemo(() => {
        if (typeof window === "undefined" || !window.matchMedia) return false;
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);

    // Variants memoized (no object churn)
    const fade = useMemo(
        () => ({
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { duration: prefersReducedMotion ? 0 : 0.12 },
        }),
        [prefersReducedMotion]
    );

    const pop = useMemo(
        () => ({
            initial: { y: prefersReducedMotion ? 0 : 16, scale: prefersReducedMotion ? 1 : 0.98, opacity: 0 },
            animate: { y: 0, scale: 1, opacity: 1, transition: { duration: prefersReducedMotion ? 0 : 0.18, ease: "easeOut" } },
            exit: { y: prefersReducedMotion ? 0 : -10, scale: prefersReducedMotion ? 1 : 0.98, opacity: 0, transition: { duration: prefersReducedMotion ? 0 : 0.14, ease: "easeIn" } },
        }),
        [prefersReducedMotion]
    );

    // Body lock + focus trap + ESC — subscribe only when open
    useEffect(() => {
        if (!isBrowser || !open) return;

        const body = document.body;
        const prevOverflow = body.style.overflow;
        body.style.overflow = "hidden";

        previouslyFocusedRef.current = document.activeElement || null;

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                if (!isConfirmingRef.current) onCancelRef.current?.();
                return;
            }
            if (e.key === "Tab") {
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

        document.addEventListener("keydown", onKeyDown, { capture: true });

        // focus after paint
        const id = requestAnimationFrame(() => {
            const target = initialFocus === "confirm" ? confirmBtnRef.current : cancelBtnRef.current;
            target?.focus?.();
        });

        return () => {
            body.style.overflow = prevOverflow;
            document.removeEventListener("keydown", onKeyDown, { capture: true });
            cancelAnimationFrame(id);
            previouslyFocusedRef.current?.focus?.();
        };
    }, [open, isBrowser, initialFocus]);

    if (!isBrowser) return null;

    const handleBackdrop = () => {
        if (!closeOnBackdrop || isConfirmingRef.current) return;
        onCancelRef.current?.();
    };

    const handleConfirm = async () => {
        const fn = onConfirmRef.current;
        if (!fn || isConfirmingRef.current) return;
        try {
            const maybe = fn();
            if (maybe && typeof maybe.then === "function") {
                setIsConfirming(true);
                await maybe;
            }
        } finally {
            setIsConfirming(false);
        }
    };

    const overlayClass =
        "fixed inset-0 z-[100] bg-[rgba(32,24,18,0.60)] " + // drop to 0.60 for less overdraw + better contrast
        (backdropBlur ? "backdrop-blur-[2px] " : "") + // optional; off by default for perf
        "will-change-opacity";

    const containerClass = "fixed inset-0 z-[101] grid place-items-center p-3";

    const panelBaseClass =
        "w-full max-w-md rounded-lg border shadow-xl outline-none will-change-transform will-change-opacity translate-z-0";
    const panelThemeClass =
        "border-[rgba(90,60,40,0.25)] bg-[#fdf6ec] dark:bg-[#2b211c] ring-1 ring-[rgba(67,49,38,0.18)]"; // lighter ring for cheaper paint
    const panelClass = `${panelBaseClass} ${panelThemeClass} ${panelClassName || ""}`;

    return createPortal(
        <AnimatePresence>
            {open ? (
                <div className={className}>
                    {/* Backdrop */}
                    <motion.div aria-hidden="true" className={overlayClass} onClick={handleBackdrop} {...fade} />

                    {/* Dialog */}
                    <div role={danger ? "alertdialog" : "dialog"} aria-modal="true" aria-labelledby={titleId} aria-describedby={descId} className={containerClass}>
                        <motion.div
                            ref={dialogRef}
                            onClick={(e) => e.stopPropagation()}
                            className={panelClass}
                            {...pop}
                        >
                            {/* Header */}
                            <div className="px-5 pt-5 pb-3 border-b border-[rgba(78,54,42,0.18)] flex items-center gap-2">
                                {icon ?? <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" />}
                                <h2 id={titleId} className="text-lg font-semibold text-[#3b2a1e] dark:text-[#e6dccf]">
                                    {title}
                                </h2>
                            </div>

                            {hint ? (
                                <p id={descId} className="px-5 mt-1 text-sm text-[#5c4433] dark:text-[#cdbfae]">
                                    {hint}
                                </p>
                            ) : null}

                            {/* Actions */}
                            <div className="px-5 pb-5 flex flex-wrap items-center justify-end gap-2 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
                                <button
                                    type="button"
                                    ref={cancelBtnRef}
                                    onClick={() => onCancelRef.current?.()}
                                    disabled={isConfirming}
                                    className="inline-flex h-10 items-center gap-2 justify-center rounded-md px-4 text-sm font-medium
                    text-[#4e362a] border border-[rgba(78,54,42,0.3)]
                    bg-[#fffaf3] hover:bg-[#f0e4d7]
                    dark:text-[#e6dccf] dark:bg-[#3b2a1e] dark:hover:bg-[#4a3627]
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b48b60] disabled:opacity-60"
                                >
                                    <X className="w-4 h-4" />
                                    {cancelLabel || t("common.cancel", fallback.cancel)}
                                </button>

                                <button
                                    type="button"
                                    ref={confirmBtnRef}
                                    onClick={handleConfirm}
                                    disabled={isConfirming}
                                    className={
                                        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold " +
                                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b48b60] disabled:opacity-60 " +
                                        (danger
                                            ? "bg-red-700 text-white hover:bg-red-800"
                                            : "bg-[#6b4226] text-[#fffaf3] hover:bg-[#59361f] dark:bg-[#d7c4a3] dark:text-[#2b211c] dark:hover:bg-[#c6af8e]")
                                    }
                                >
                                    {isConfirming ? (
                                        <span className="inline-flex items-center gap-2">
                      <Spinner aria-label="Working…" />
                      <span>{confirmLabel || t("common.confirm", fallback.confirm)}</span>
                    </span>
                                    ) : (
                                        confirmLabel || t("common.confirm", fallback.confirm)
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            ) : null}
        </AnimatePresence>,
        document.body
    );
});

export default LeaveGuard;
