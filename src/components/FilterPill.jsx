import { SlidersHorizontal } from "lucide-react"

export default function FilterPill({
                                       activeCount = 0,
                                       onClick,
                                       label = "Filter",
                                   }) {
    const isActive = activeCount > 0

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={isActive}
            className={[
                "relative inline-flex items-center gap-2.5",
                // allow content to drive width; comfy horizontal padding for wider scripts
                "min-h-10 px-4",
                "rounded-xl border bg-white shadow-sm",
                "hover:bg-gray-50 active:scale-95 transition",
                isActive ? "border-[#2d1a14] ring-1 ring-[#2d1a14]/40" : "border-gray-200",
            ].join(" ")}
        >
            <SlidersHorizontal className="h-4 w-4 text-gray-700 shrink-0" />
            {/* keep label on one line and stop it from shrinking */}
            <span className="text-sm font-medium text-gray-800 whitespace-nowrap shrink-0 leading-tight">
        {label}
      </span>
            {activeCount > 0 && (
                <span className="ml-1 rounded-full text-[11px] px-1.5 py-0.5 bg-[#2d1a14] text-white shrink-0">
          {activeCount}
        </span>
            )}
        </button>
    )
}
