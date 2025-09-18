import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function QtyStepper({
                                       value,
                                       onDec,
                                       onInc,
                                       size = "md",
                                       min = 0,
                                       max,          // optional
                                       step = 1,     // optional (kept for API compatibility)
                                   }) {
    const { t } = useTranslation();

    const sz = {
        sm: { box: "h-7 w-7", icon: "h-4 w-4", valueW: "w-8", text: "text-sm" },
        md: { box: "h-8 w-8", icon: "h-4 w-4", valueW: "w-10", text: "text-base" },
        lg: { box: "h-10 w-10", icon: "h-5 w-5", valueW: "w-12", text: "text-lg" },
    }[size] || { box: "h-8 w-8", icon: "h-4 w-4", valueW: "w-10", text: "text-base" };

    const decDisabled = value <= min;
    const incDisabled = typeof max === "number" ? value >= max : false;

    const dec = () => {
        if (!decDisabled && typeof onDec === "function") onDec();
    };
    const inc = () => {
        if (!incDisabled && typeof onInc === "function") onInc();
    };

    return (
        <div className="inline-flex items-center gap-2">
            <button
                type="button"
                onClick={dec}
                disabled={decDisabled}
                aria-label={t("qty.decrease", { defaultValue: "Decrease" })}
                className={[
                    sz.box,
                    "grid place-items-center rounded-xl border transition active:scale-95",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#c9a44c]",
                    decDisabled
                        ? "border-[#e8dfd0] text-[#9b8b7c] cursor-not-allowed"
                        : "border-[#e7dbc9] text-[#2d1a14] bg-white/70 hover:bg-[#f6efe3]",
                ].join(" ")}
            >
                <Minus className={sz.icon} />
            </button>

            <div
                className={[
                    sz.valueW,
                    "text-center select-none font-semibold tabular-nums",
                    "text-[#2d1a14]",
                    sz.text,
                ].join(" ")}
                aria-live="polite"
                aria-atomic="true"
            >
                {value}
            </div>

            <button
                type="button"
                onClick={inc}
                disabled={incDisabled}
                aria-label={t("qty.increase", { defaultValue: "Increase" })}
                className={[
                    sz.box,
                    "grid place-items-center rounded-xl border transition active:scale-95",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#c9a44c]",
                    incDisabled
                        ? "border-[#e8dfd0] text-[#9b8b7c] cursor-not-allowed"
                        : "border-[#e7dbc9] text-[#2d1a14] bg-white/70 hover:bg-[#f6efe3]",
                ].join(" ")}
            >
                <Plus className={sz.icon} />
            </button>
        </div>
    );
}
