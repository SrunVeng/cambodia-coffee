import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCallback, useRef } from "react";

export default function QtyStepper({
                                       value,
                                       onDec,
                                       onInc,
                                       size = "md",
                                       min = 0,
                                       max,       // optional
                                       step = 1,  // kept for API compatibility
                                   }) {
    const { t } = useTranslation();

    const tokens =
        {
            sm: { box: "h-8 w-8", icon: "h-4 w-4", valueW: "w-10", text: "text-sm" },
            md: { box: "h-9 w-9", icon: "h-4 w-4", valueW: "w-12", text: "text-base" },
            lg: { box: "h-10 w-10", icon: "h-5 w-5", valueW: "w-14", text: "text-lg" },
        }[size] || { box: "h-9 w-9", icon: "h-4 w-4", valueW: "w-12", text: "text-base" };

    const decDisabled = value <= min;
    const incDisabled = typeof max === "number" ? value >= max : false;

    const handleDec = useCallback(() => {
        if (!decDisabled && typeof onDec === "function") onDec();
    }, [decDisabled, onDec]);

    const handleInc = useCallback(() => {
        if (!incDisabled && typeof onInc === "function") onInc();
    }, [incDisabled, onInc]);

    // Keyboard support: left/down = dec, right/up = inc, Home/End jump to min/max if provided
    const groupRef = useRef(null);
    const onKeyDown = (e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            handleDec();
        } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            handleInc();
        } else if (e.key === "Home" && typeof min === "number") {
            e.preventDefault();
            // walk down to min
            let times = Math.max(0, value - min);
            while (times--) handleDec();
        } else if (e.key === "End" && typeof max === "number") {
            e.preventDefault();
            // walk up to max
            let times = Math.max(0, max - value);
            while (times--) handleInc();
        }
    };

    // Common classes
    const baseBtn =
        "grid place-items-center rounded-xl border transition active:scale-95 " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#c9a44c] " +
        "disabled:cursor-not-allowed";

    const btnEnabled = "border-[#e7dbc9] text-[#2d1a14] bg-white hover:bg-[#f6efe3]";
    const btnDisabled = "border-[#e8dfd0] text-[#9b8b7c] bg-[#fbf7ef]";

    return (
        <div
            ref={groupRef}
            role="group"
            aria-label={t("qty.label", { defaultValue: "Quantity" })}
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="inline-flex items-center gap-2 max-w-full"
            style={{ contain: "layout paint" }} // guards against accidental overflow on mobile
        >
            <button
                type="button"
                onClick={handleDec}
                disabled={decDisabled}
                aria-label={t("qty.decrease", { defaultValue: "Decrease" })}
                className={[tokens.box, baseBtn, decDisabled ? btnDisabled : btnEnabled, "shrink-0"].join(" ")}
            >
                <Minus className={tokens.icon} aria-hidden="true" />
            </button>

            <div
                className={[
                    tokens.valueW,
                    "text-center select-none font-semibold tabular-nums",
                    "text-[#2d1a14] leading-none",
                    "px-1",
                    tokens.text,
                ].join(" ")}
                aria-live="polite"
                aria-atomic="true"
            >
                {value}
            </div>

            <button
                type="button"
                onClick={handleInc}
                disabled={incDisabled}
                aria-label={t("qty.increase", { defaultValue: "Increase" })}
                className={[tokens.box, baseBtn, incDisabled ? btnDisabled : btnEnabled, "shrink-0"].join(" ")}
            >
                <Plus className={tokens.icon} aria-hidden="true" />
            </button>
        </div>
    );
}
