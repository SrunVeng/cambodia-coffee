import React, { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";

/**
 * QtyStepper (flat design + your hover/tap pattern)
 */
export default function QtyStepper({
                                       value = 1,
                                       min = 1,
                                       max,
                                       step = 1,
                                       onDec,
                                       onInc,
                                       onChange,
                                       size = "md",
                                       disabled = false,
                                       className = "",
                                       unit,
                                       showQuickAdds = false,
                                       quickAdds,
                                   }) {
    const sizes = {
        sm: { btnH: "h-8", text: "text-sm", pad: "px-2.5", gap: "gap-1.5", icon: "w-4 h-4", inph: "h-8 px-2", chip: "text-xs px-2 py-1" },
        md: { btnH: "h-10", text: "text-base", pad: "px-3.5", gap: "gap-2", icon: "w-4 h-4", inph: "h-10 px-3", chip: "text-sm px-3 py-1.5" },
        lg: { btnH: "h-12", text: "text-lg", pad: "px-4", gap: "gap-2.5", icon: "w-5 h-5", inph: "h-12 px-4", chip: "text-base px-3.5 py-2" },
    };
    const S = sizes[size] ?? sizes.md;

    const safeMin = Math.max(min ?? 0, 0);
    const safeMax = typeof max === "number" ? Math.max(max, safeMin) : undefined;

    const canDec = !disabled && value > safeMin;
    const canInc = !disabled && (typeof safeMax !== "number" || value < safeMax);

    const theme =
        "text-[#2d1a14] [--ring:#c9a44c] [--brd:#e7dbc9] [--bg:255_249_241] [--bg2:255_255_255]";

    const wrapBase = "inline-flex items-center";

    // Rectangular button base
    const btnBase =
        "inline-flex items-center justify-center rounded-lg " +
        "bg-white/90 hover:bg-white " +
        "ring-1 ring-inset ring-[color:var(--brd)] " +
        "transition-colors duration-150 ease-out " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 " +
        "disabled:opacity-40 disabled:cursor-not-allowed";

    const centerBase =
        "font-semibold tabular-nums tracking-tight select-none rounded-lg " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]";

    // ---------- Helpers ----------
    const clamp = (n) => {
        const lo = safeMin;
        const hi = typeof safeMax === "number" ? safeMax : Number.POSITIVE_INFINITY;
        if (!Number.isFinite(n)) return lo;
        return Math.min(Math.max(Math.trunc(n), lo), hi);
    };

    const applyChange = (next) => {
        const c = clamp(next);
        if (onChange) {
            onChange(c);
            return;
        }
        const delta = c - value;
        if (delta > 0) onInc?.();
        else if (delta < 0) onDec?.();
    };

    const incOnce = () => {
        if (!canInc) return;
        if (onChange) applyChange(value + step);
        else onInc?.();
    };
    const decOnce = () => {
        if (!canDec) return;
        if (onChange) applyChange(value - step);
        else onDec?.();
    };

    // ---------- Hold-to-repeat with acceleration ----------
    const holdRef = useRef({ t: null, int: null, started: false, ticks: 0, kind: null });
    const clearHold = () => {
        const h = holdRef.current;
        if (h.t) clearTimeout(h.t);
        if (h.int) clearInterval(h.int);
        holdRef.current = { t: null, int: null, started: false, ticks: 0, kind: null };
    };
    useEffect(() => {
        const up = () => clearHold();
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
        return () => {
            window.removeEventListener("pointerup", up);
            window.removeEventListener("pointercancel", up);
            clearHold();
        };
    }, []);
    const startHold = (kind) => {
        if (disabled) return;
        clearHold();
        holdRef.current.kind = kind;
        holdRef.current.t = setTimeout(() => {
            holdRef.current.started = true;
            holdRef.current.ticks = 0;
            let interval = 140;
            const tick = () => {
                holdRef.current.ticks += 1;
                if (holdRef.current.kind === "inc") {
                    if (!canInc) return clearHold();
                    incOnce();
                } else {
                    if (!canDec) return clearHold();
                    decOnce();
                }
                if (holdRef.current.ticks === 15 || holdRef.current.ticks === 35 || holdRef.current.ticks === 70) {
                    clearInterval(holdRef.current.int);
                    interval = holdRef.current.ticks === 15 ? 90 : holdRef.current.ticks === 35 ? 55 : 35;
                    holdRef.current.int = setInterval(tick, interval);
                }
            };
            holdRef.current.int = setInterval(tick, interval);
        }, 260);
    };

    // ---------- Editable center (only if onChange provided) ----------
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");
    useEffect(() => {
        if (!editing) setDraft(String(value));
    }, [value, editing]);
    const commitDraft = () => {
        const n = clamp(Number(draft));
        applyChange(n);
        setEditing(false);
    };
    const cancelEdit = () => {
        setDraft(String(value));
        setEditing(false);
    };
    const canType = !!onChange && !disabled;

    // readable number + stable width
    const fmt = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }), []);
    const display = fmt.format(value);
    const ch = Math.max(3, String(display).length + (unit ? unit.length + 1 : 0));

    // Quick add chips
    const quickList = useMemo(() => quickAdds ?? [10, 50, 100], [quickAdds]);

    // Keyboard
    const onWrapperKeyDown = (e) => {
        if (disabled) return;
        if (e.key === "ArrowUp" || e.key === "+") {
            e.preventDefault();
            incOnce();
        } else if (e.key === "ArrowDown" || e.key === "-") {
            e.preventDefault();
            decOnce();
        }
    };

    return (
        <div className={`flex flex-col items-start ${theme} ${className}`} onKeyDown={onWrapperKeyDown}>
            <div className={`${wrapBase} ${S.gap} ${S.pad}`} role="group" aria-label="Quantity stepper">
                {/* Decrease */}
                <motion.button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={!canDec}
                    onClick={decOnce}
                    onPointerDown={() => startHold("dec")}
                    onPointerUp={clearHold}
                    onPointerLeave={clearHold}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className={`${btnBase} ${S.btnH} px-3`}
                >
                    <Minus className={`${S.icon}`} aria-hidden="true" />
                </motion.button>

                {/* Center display / input */}
                <div className="flex items-center">
                    {canType && editing ? (
                        <input
                            autoFocus
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={safeMin}
                            max={safeMax}
                            className={`${S.inph} ${S.text} ${centerBase} bg-white/70 ring-1 ring-inset ring-[color:var(--brd)] text-center w-[8ch]`}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
                            onBlur={commitDraft}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); commitDraft(); }
                                if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
                            }}
                            aria-label="Enter quantity"
                        />
                    ) : (
                        <button
                            type="button"
                            className={`${S.inph} ${S.text} ${centerBase} hover:bg-white/60 text-center transition-colors duration-150`}
                            onClick={() => canType && setEditing(true)}
                            title={canType ? "Tap to type" : undefined}
                            aria-live="polite"
                            aria-atomic="true"
                            role="spinbutton"
                            aria-valuemin={safeMin}
                            aria-valuemax={typeof safeMax === "number" ? safeMax : undefined}
                            aria-valuenow={value}
                            style={{ minWidth: `${ch}ch` }}
                        >
                            {display}
                            {unit ? <span className="ml-1 font-normal opacity-70">{unit}</span> : null}
                        </button>
                    )}
                </div>

                {/* Increase */}
                <motion.button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={!canInc}
                    onClick={incOnce}
                    onPointerDown={() => startHold("inc")}
                    onPointerUp={clearHold}
                    onPointerLeave={clearHold}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className={`${btnBase} ${S.btnH} px-3`}
                >
                    <Plus className={`${S.icon}`} aria-hidden="true" />
                </motion.button>
            </div>

            {/* Quick adds (optional) */}
            {showQuickAdds && !!onChange && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {quickList.map((q) => {
                        const next = clamp(value + q);
                        const disabledChip = disabled || (typeof safeMax === "number" && value >= safeMax);
                        return (
                            <button
                                key={q}
                                type="button"
                                disabled={disabledChip}
                                onClick={() => applyChange(next)}
                                className={`${S.chip} rounded-full ring-1 ring-inset ring-[color:var(--brd)] bg-white/90 hover:bg-white transition-colors duration-150`}
                                title={`Add +${q}${unit ? " " + unit : ""}`}
                            >
                                +{q}{unit ? unit : ""}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
