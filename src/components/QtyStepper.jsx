import React, { useMemo, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Enhanced Stepper
 * — Accessible, animated, and themeable horizontal stepper
 *
 * Props
 *  - steps: Array<string | { id?: string|number, label: string }>
 *  - active: number (0-based index of the current step)
 *  - completed: boolean[] (same length as steps)
 *  - reachable: boolean[] (same length as steps)
 *  - lastVisited: number | undefined
 *  - onStepClick: (index:number)=>void
 *  - size: "sm" | "md" | "lg" (default: "md")
 *  - showPartial: boolean (default: true) – show half connector for the active step
 *  - className: string
 *  - clickable: boolean (default: true)
 *  - variant: "brand" | "neutral" (default: "brand") – color palette
 *
 * Accessibility
 *  - The nav has role="progressbar" with aria-valuenow/min/max.
 *  - Each step button has aria-current="step" when active.
 *  - Full keyboard support: ←/→ to move focus, Home/End to jump, Enter/Space to activate.
 */
export default function Stepper({
                                    steps = [],
                                    active = 0,
                                    completed = [],
                                    reachable = [],
                                    lastVisited,
                                    onStepClick,
                                    size = "md",
                                    showPartial = true,
                                    className = "",
                                    clickable = true,
                                    variant = "brand",
                                }) {
    const reduceMotion = useReducedMotion?.() ?? false;

    const items = useMemo(
        () =>
            steps.map((s, i) =>
                typeof s === "string" ? { id: i, label: s } : { id: s.id ?? i, label: s.label }
            ),
        [steps]
    );

    const last = Math.max(items.length - 1, 0);
    const safeActive = Math.min(Math.max(active, 0), last);
    const segCount = Math.max(items.length - 1, 0);

    const sizeCfg = {
        sm: { dot: 32, icon: 16, label: "text-xs", ring: "ring-1", trackH: "h-[2px]" },
        md: { dot: 44, icon: 18, label: "text-sm", ring: "ring-2", trackH: "h-[3px]" },
        lg: { dot: 56, icon: 20, label: "text-base", ring: "ring-2", trackH: "h-[4px]" },
    }[size] ?? { dot: 44, icon: 18, label: "text-sm", ring: "ring-2", trackH: "h-[3px]" };

    const palette = variant === "neutral"
        ? {
            dotDone: "from-gray-900 to-gray-700",
            dotActiveBg: "bg-white",
            dotIdleBg: "bg-gray-50",
            dotIdleText: "text-gray-500",
            dotActiveText: "text-gray-900",
            dotVisited: "bg-white",
            border: "border-gray-300",
            ring: "ring-gray-300",
            trackBg: "bg-gray-200",
            trackHalf: "bg-gray-500",
            trackFull: "bg-gray-900",
            shadowGlow: "shadow-[0_0_0_0_rgba(0,0,0,0)]",
        }
        : {
            // "brand" (coffee) palette – tweak freely
            dotDone: "from-[#4b2e24] to-[#2d1a14]",
            dotActiveBg: "bg-[#fffaf3]",
            dotIdleBg: "bg-[#fbf8f3]",
            dotIdleText: "text-[#857567]",
            dotActiveText: "text-[#2d1a14]",
            dotVisited: "bg-[#fff8ef]",
            border: "border-[#e7dbc9]",
            ring: "ring-[#c9a44c]",
            trackBg: "bg-[#e7dbc9]",
            trackHalf: "bg-[#c9a44c]",
            trackFull: "bg-[#4b2e24]",
            shadowGlow: "shadow-[0_0_0_0_rgba(0,0,0,0)]",
        };

    // Build CSS columns: dot, 1fr, dot, 1fr, ... dot
    const cols = [];
    for (let i = 0; i < items.length; i++) {
        cols.push("var(--dot)");
        if (i < items.length - 1) cols.push("1fr");
    }

    const connectorState = (i) => {
        if (i < safeActive) return "full";
        if (i === safeActive && i < segCount && showPartial) return "half";
        return "empty";
    };

    // refs for keyboard nav
    const btnRefs = useRef([]);
    btnRefs.current = [];
    const setBtnRef = (el) => {
        if (el) btnRefs.current.push(el);
    };

    const canStepClick = (i) =>
        typeof onStepClick === "function" && clickable && (reachable[i] || i <= safeActive);

    const moveFocus = (nextIdx) => {
        const clamped = Math.max(0, Math.min(items.length - 1, nextIdx));
        const el = btnRefs.current[clamped];
        if (el) el.focus();
    };

    const onKeyDown = (e, i) => {
        // Allow navigation even if the button is disabled, for accessibility
        switch (e.key) {
            case "ArrowLeft":
            case "Left":
                e.preventDefault();
                moveFocus(i - 1);
                break;
            case "ArrowRight":
            case "Right":
                e.preventDefault();
                moveFocus(i + 1);
                break;
            case "Home":
                e.preventDefault();
                moveFocus(0);
                break;
            case "End":
                e.preventDefault();
                moveFocus(items.length - 1);
                break;
            case "Enter":
            case " ": // Space
                if (canStepClick(i)) {
                    e.preventDefault();
                    onStepClick?.(i);
                }
                break;
            default:
                break;
        }
    };

    // Announce active step change politely
    const liveRef = useRef(null);
    useEffect(() => {
        if (liveRef.current) {
            liveRef.current.textContent = `Step ${safeActive + 1} of ${items.length}: ${items[safeActive]?.label ?? ""}`;
        }
    }, [safeActive, items]);

    return (
        <nav
            aria-label="Progress"
            role="progressbar"
            aria-valuemin={1}
            aria-valuenow={items.length ? safeActive + 1 : 0}
            aria-valuemax={items.length || 1}
            className={`w-full bg-transparent ${className}`}
        >
            {/* live region for SR users */}
            <p ref={liveRef} className="sr-only" aria-live="polite" />

            {/* Mobile helper */}
            <p className="sm:hidden mb-3 text-xs text-[#857567] text-center select-none">
                {items.length ? `Step ${safeActive + 1} of ${items.length}` : "—"}
            </p>

            <div
                className="grid gap-y-2 sm:gap-y-3"
                style={{
                    gridTemplateColumns: cols.join(" "),
                    ["--dot"]: `${sizeCfg.dot}px`,
                }}
            >
                {items.map((step, i) => {
                    const isDone = !!completed[i];
                    const isActive = i === safeActive;
                    const wasVisited = lastVisited === i && !isActive;
                    const canClick = canStepClick(i);

                    const baseBtn = `flex items-center justify-center rounded-full border shadow-sm transition-colors focus:outline-none focus-visible:${sizeCfg.ring} focus-visible:ring-offset-2 focus-visible:ring-offset-white/80 ${palette.ring}`;
                    const dimWhenDisabled = canClick ? "opacity-100" : "opacity-80";

                    const stateClasses = isDone
                        ? `bg-gradient-to-br ${palette.dotDone} text-white border-transparent`
                        : isActive
                            ? `${palette.dotActiveBg} ${palette.dotActiveText} ${palette.border}`
                            : wasVisited
                                ? `${palette.dotVisited} ${palette.dotActiveText} ${palette.border}`
                                : `${palette.dotIdleBg} ${palette.dotIdleText} ${palette.border}`;

                    return (
                        <React.Fragment key={step.id}>
                            {/* DOT */}
                            <div className="row-start-1 col-span-1 flex items-center justify-center">
                                <motion.button
                                    ref={setBtnRef}
                                    type="button"
                                    whileHover={canClick && !reduceMotion ? { scale: 1.06 } : undefined}
                                    whileTap={canClick && !reduceMotion ? { scale: 0.96 } : undefined}
                                    animate={!reduceMotion
                                        ? isActive
                                            ? { scale: 1.1, boxShadow: "0 0 0 6px rgba(201,164,76,0.35)" }
                                            : wasVisited
                                                ? { scale: 1.03, boxShadow: "0 0 0 4px rgba(75,46,36,0.25)" }
                                                : { scale: 1, boxShadow: "0 0 0 0px rgba(0,0,0,0)" }
                                        : undefined}
                                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                                    onKeyDown={(e) => onKeyDown(e, i)}
                                    onClick={() => (canClick ? onStepClick?.(i) : null)}
                                    disabled={!canClick}
                                    aria-current={isActive ? "step" : undefined}
                                    aria-disabled={!canClick ? true : undefined}
                                    tabIndex={isActive ? 0 : -1}
                                    className={`${baseBtn} w-[var(--dot)] h-[var(--dot)] ${stateClasses} ${dimWhenDisabled} ${
                                        canClick ? "cursor-pointer" : "cursor-default select-none"
                                    }`}
                                    title={canClick ? `Go to ${step.label}` : step.label}
                                >
                                    {isDone ? (
                                        <motion.svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            className="shrink-0"
                                            width={sizeCfg.icon}
                                            height={sizeCfg.icon}
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <motion.path
                                                d="M20 6 9 17l-5-5"
                                                initial={reduceMotion ? undefined : { pathLength: 0 }}
                                                animate={reduceMotion ? undefined : { pathLength: 1 }}
                                                transition={{ duration: 0.5, ease: "easeOut" }}
                                            />
                                        </motion.svg>
                                    ) : (
                                        <span className="font-semibold" style={{ fontSize: sizeCfg.icon * 0.7 }}>
                      {i + 1}
                    </span>
                                    )}

                                    {/* Active glow pulse */}
                                    {isActive && !reduceMotion && (
                                        <motion.span
                                            aria-hidden
                                            className="absolute inset-0 rounded-full"
                                            style={{ boxShadow: "0 0 0 0 rgba(201,164,76,0.0)" }}
                                            animate={{ boxShadow: [
                                                    "0 0 0 0 rgba(201,164,76,0.0)",
                                                    "0 0 0 12px rgba(201,164,76,0.12)",
                                                    "0 0 0 0 rgba(201,164,76,0.0)",
                                                ] }}
                                            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                                        />
                                    )}
                                </motion.button>
                            </div>

                            {/* CONNECTOR */}
                            {i < segCount && (
                                <div className="row-start-1 col-span-1 flex items-center">
                                    <div className={`w-full ${sizeCfg.trackH} rounded-full ${palette.trackBg} overflow-hidden relative`}>
                                        {/* shimmer (behind) */}
                                        {!reduceMotion && (
                                            <motion.div
                                                aria-hidden
                                                className="absolute inset-y-0 left-0 w-1/3 opacity-0"
                                                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)" }}
                                                animate={{ x: ["-50%", "150%"], opacity: [0, 1, 0] }}
                                                transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                                            />
                                        )}

                                        <motion.div
                                            className={`h-full rounded-full ${
                                                connectorState(i) === "half"
                                                    ? palette.trackHalf
                                                    : connectorState(i) === "full"
                                                        ? palette.trackFull
                                                        : palette.trackBg
                                            }`}
                                            initial={reduceMotion ? undefined : { width: 0 }}
                                            animate={{
                                                width:
                                                    connectorState(i) === "full"
                                                        ? "100%"
                                                        : connectorState(i) === "half"
                                                            ? "50%"
                                                            : "0%",
                                            }}
                                            transition={{ duration: 0.55, ease: "easeInOut" }}
                                        />
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}

                {/* Labels */}
                {items.map((step, i) => {
                    const isDone = !!completed[i];
                    const isActive = i === safeActive;
                    const wasVisited = lastVisited === i && !isActive;
                    return (
                        <div
                            key={`label-${step.id}`}
                            className="row-start-2 flex items-start justify-center"
                            style={{ gridColumn: `${i * 2 + 1} / span 1` }}
                        >
              <span
                  className={`${sizeCfg.label} text-center max-w-[120px] sm:max-w-[160px] leading-tight truncate ${
                      isActive
                          ? `${palette.dotActiveText} font-bold`
                          : wasVisited
                              ? "text-[#c9a44c] font-medium"
                              : isDone
                                  ? "text-[#3b2a1d] font-medium"
                                  : palette.dotIdleText
                  }`}
                  title={step.label}
              >
                {step.label}
              </span>
                        </div>
                    );
                })}
            </div>
        </nav>
    );
}
