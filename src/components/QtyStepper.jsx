import { Minus, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useCallback, useRef, useState } from "react"

export default function QtyStepper({
                                       value,
                                       onDec,
                                       onInc,
                                       onSet,             // optional: (next:number) => void
                                       size = "md",
                                       min = 0,
                                       max,               // optional
                                       step = 1,          // kept for API compatibility
                                       editable = true,   // click number to type
                                   }) {
    const { t } = useTranslation()

    const tokens =
        {
            sm: { box: "h-8 w-8", icon: "h-4 w-4", valueW: "w-10", text: "text-sm" },
            md: { box: "h-9 w-9", icon: "h-4 w-4", valueW: "w-12", text: "text-base" },
            lg: { box: "h-10 w-10", icon: "h-5 w-5", valueW: "w-14", text: "text-lg" },
        }[size] || { box: "h-9 w-9", icon: "h-4 w-4", valueW: "w-12", text: "text-base" }

    const decDisabled = value <= min
    const incDisabled = typeof max === "number" ? value >= max : false

    const handleDec = useCallback(() => {
        if (!decDisabled && typeof onDec === "function") onDec()
    }, [decDisabled, onDec])

    const handleInc = useCallback(() => {
        if (!incDisabled && typeof onInc === "function") onInc()
    }, [incDisabled, onInc])

    // ----- Hold-to-repeat with acceleration -----
    const holdRef = useRef({ t1: null, t2: null, t3: null, int: null })
    const clearHold = () => {
        const h = holdRef.current
        ;["t1","t2","t3","int"].forEach((k) => {
            if (h[k]) clearTimeout(h[k]), clearInterval(h[k]), (h[k] = null)
        })
    }

    const startHold = (dir, e) => {
        const factor = e?.shiftKey ? 5 : (e?.metaKey || e?.ctrlKey) ? 10 : 1
        const tick = () => {
            for (let i = 0; i < factor; i++) {
                dir === "inc" ? handleInc() : handleDec()
            }
        }
        // fire once immediately
        tick()

        // after short delay, start accelerating intervals
        clearHold()
        const h = holdRef.current
        h.t1 = setTimeout(() => {
            // stage 1
            h.int = setInterval(tick, 280)
            // stage 2 (faster)
            h.t2 = setTimeout(() => {
                clearInterval(h.int)
                h.int = setInterval(tick, 140)
                // stage 3 (fastest)
                h.t3 = setTimeout(() => {
                    clearInterval(h.int)
                    h.int = setInterval(tick, 60)
                }, 900)
            }, 700)
        }, 250)
    }

    // stop on any pointer release/leave/cancel
    const stopHold = () => clearHold()

    // Keyboard support: arrows + Home/End
    const onKeyDown = (e) => {
        const mult = e.shiftKey ? 5 : (e.metaKey || e.ctrlKey) ? 10 : 1
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault()
            for (let i = 0; i < mult; i++) handleDec()
        } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault()
            for (let i = 0; i < mult; i++) handleInc()
        } else if (e.key === "Home" && typeof min === "number") {
            e.preventDefault()
            commitValue(min)
        } else if (e.key === "End" && typeof max === "number") {
            e.preventDefault()
            commitValue(max)
        }
    }

    // ----- Editable value (click to type) -----
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(String(value))

    const clamp = (n) => {
        if (Number.isNaN(n)) return value
        if (typeof max === "number") n = Math.min(max, n)
        n = Math.max(min, n)
        return n
    }

    const commitValue = (next) => {
        const n = clamp(Number(next))
        if (n === value) return setEditing(false)

        if (typeof onSet === "function") {
            onSet(n)
        } else {
            // simulate with onInc/onDec so it stays backward compatible
            let diff = n - value
            if (diff > 0) while (diff--) handleInc()
            else while (diff++) handleDec()
        }
        setEditing(false)
    }

    // Common classes
    const baseBtn =
        "grid place-items-center rounded-xl border transition active:scale-95 " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#c9a44c] " +
        "disabled:cursor-not-allowed"

    const btnEnabled = "border-[#e7dbc9] text-[#2d1a14] bg-white hover:bg-[#f6efe3]"
    const btnDisabled = "border-[#e8dfd0] text-[#9b8b7c] bg-[#fbf7ef]"

    return (
        <div
            role="group"
            aria-label={t("qty.label", { defaultValue: "Quantity" })}
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="inline-flex items-center gap-2 max-w-full"
            style={{ contain: "layout paint" }}
        >
            <button
                type="button"
                onPointerDown={(e) => !decDisabled && startHold("dec", e)}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onPointerCancel={stopHold}
                onClick={(e) => { /* click already fired in startHold; no-op */ }}
                disabled={decDisabled}
                aria-label={t("qty.decrease", { defaultValue: "Decrease" })}
                className={[tokens.box, baseBtn, decDisabled ? btnDisabled : btnEnabled, "shrink-0 select-none"].join(" ")}
            >
                <Minus className={tokens.icon} aria-hidden="true" />
            </button>

            {/* Value: editable or static */}
            <div className={`${tokens.valueW} text-center select-none`}>
                {editable && editing ? (
                    <input
                        autoFocus
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={[
                            "w-full text-center font-semibold tabular-nums",
                            "text-[#2d1a14] leading-none px-1 rounded-md border border-[#e7dbc9] bg-white",
                            tokens.text,
                        ].join(" ")}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
                        onBlur={() => commitValue(draft)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); commitValue(draft) }
                            if (e.key === "Escape") { e.preventDefault(); setEditing(false) }
                        }}
                    />
                ) : (
                    <button
                        type="button"
                        className={[
                            "w-full px-1 font-semibold tabular-nums",
                            "text-[#2d1a14] leading-none",
                            tokens.text,
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44c] rounded-md",
                        ].join(" ")}
                        title={String(value)}
                        aria-live="polite"
                        aria-atomic="true"
                        onClick={() => editable && (setEditing(true), setDraft(String(value)))}
                    >
                        {value}
                    </button>
                )}
            </div>

            <button
                type="button"
                onPointerDown={(e) => !incDisabled && startHold("inc", e)}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onPointerCancel={stopHold}
                onClick={() => {}}
                disabled={incDisabled}
                aria-label={t("qty.increase", { defaultValue: "Increase" })}
                className={[tokens.box, baseBtn, incDisabled ? btnDisabled : btnEnabled, "shrink-0 select-none"].join(" ")}
            >
                <Plus className={tokens.icon} aria-hidden="true" />
            </button>
        </div>
    )
}
