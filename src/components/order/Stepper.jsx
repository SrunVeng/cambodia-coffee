import React from "react"

/**
 * Props
 * - steps: string[] | { id?: string|number, label: string }[]
 * - active: number (0-based)
 * - completed?: boolean[]
 * - maxReachable?: number
 * - onStepClick?: (index:number) => void
 * - size?: "sm" | "md"   // dot size (sm=36px, md=48px)
 * - showPartial?: boolean // fill half of the next connector from the active step
 * - className?: string
 */
export default function Stepper({
                                    steps = [],
                                    active = 0,
                                    completed,
                                    maxReachable,
                                    onStepClick,
                                    size = "md",
                                    showPartial = true,
                                    className = "",
                                }) {
    const items = steps.map((s, i) =>
        typeof s === "string" ? { id: i, label: s } : { id: s.id ?? i, label: s.label }
    )
    const last = Math.max(items.length - 1, 0)
    const safeActive = Math.min(Math.max(active, 0), last)

    const fallbackReachable =
        Array.isArray(completed) && completed.length
            ? Math.min(Math.max(completed.lastIndexOf(true) + 1, 0), last)
            : safeActive

    const highestReachable =
        typeof maxReachable === "number"
            ? Math.max(0, Math.min(maxReachable, last))
            : fallbackReachable

    // === Layout math ===
    // Grid columns: [DOT][SEG][DOT][SEG]...[DOT]
    // DOT columns are fixed to --dot; SEG columns are 1fr (equal length)
    const segCount = Math.max(items.length - 1, 0)
    const dotPx = size === "sm" ? 36 : 48
    const cols = []
    for (let i = 0; i < items.length; i++) {
        cols.push("var(--dot)")
        if (i < items.length - 1) cols.push("1fr")
    }

    const connectorState = (i) => {
        // connector between step i and i+1
        if (i < safeActive) return "full"
        if (i === safeActive && i < segCount && showPartial) return "half"
        return "empty"
    }

    return (
        <nav
            aria-label="Progress"
            className={`w-full bg-transparent ${className}`}
            style={{ backgroundColor: "transparent" }}
        >

        {/* Mobile helper */}
            <p className="sm:hidden mb-3 text-xs text-[#857567] text-center">
                {items.length ? `Step ${safeActive + 1} of ${items.length}` : "—"}
            </p>

            {/* Main grid: row 1 => dots + connectors, row 2 => labels. */}
            <div
                className="grid gap-y-2 sm:gap-y-3"
                style={{
                    // equal connector segments, fixed-size dots
                    gridTemplateColumns: cols.join(" "),
                    // dot size variable used by DOT columns
                    ["--dot"]: `${dotPx}px`,
                }}
            >
                {/* ==== Row 1: Dots & Connectors (placed into alternating columns) ==== */}
                {items.map((step, i) => {
                    const isDone = Array.isArray(completed) ? !!completed[i] : i < safeActive
                    const isActive = i === safeActive
                    const canClick = typeof onStepClick === "function" && i <= highestReachable

                    // DOT (odd index in conceptual sequence, but actual grid column)
                    return (
                        <React.Fragment key={step.id}>
                            <div className="row-start-1 col-span-1 flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => (canClick ? onStepClick(i) : null)}
                                    disabled={!canClick}
                                    aria-current={isActive ? "step" : undefined}
                                    className={`flex items-center justify-center rounded-full border shadow-sm transition-all duration-300
                    w-[var(--dot)] h-[var(--dot)]
                    ${
                                        isDone
                                            ? "bg-gradient-to-br from-[#4b2e24] to-[#2d1a14] text-white border-transparent"
                                            : isActive
                                                ? "bg-[#fffaf3] text-[#3b2a1d] border-[#c9a44c] ring-2 ring-[#c9a44c]"
                                                : "bg-[#fbf8f3] text-[#857567] border-[#e7dbc9]"
                                    }
                    ${canClick ? "cursor-pointer" : "cursor-not-allowed opacity-60"}
                  `}
                                >
                                    {isDone ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                    ) : (
                                        <span className="text-sm font-semibold">{i + 1}</span>
                                    )}
                                </button>
                            </div>

                            {/* CONNECTOR segment after every dot except the last */}
                            {i < segCount && (
                                <div className="row-start-1 col-span-1 flex items-center">
                                    <div className="w-full h-[2px] sm:h-[3px] rounded-full bg-[#e7dbc9] overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-[width] duration-500 sm:duration-700 ease-in-out ${
                                                connectorState(i) === "full"
                                                    ? "bg-[#4b2e24] w-full"
                                                    : connectorState(i) === "half"
                                                        ? "bg-gradient-to-r from-[#4b2e24] to-[#c9a44c] w-1/2"
                                                        : "w-0"
                                            }`}
                                        />
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}

                {/* ==== Row 2: Labels (aligned under each dot column only) ==== */}
                {items.map((step, i) => {
                    const isDone = Array.isArray(completed) ? !!completed[i] : i < safeActive
                    const isActive = i === safeActive
                    return (
                        <div
                            key={`label-${step.id}`}
                            className="row-start-2 flex items-start justify-center"
                            // Place each label directly under its DOT column (every other col)
                            style={{ gridColumn: `${i * 2 + 1} / span 1` }}
                        >
              <span
                  className={`text-xs sm:text-sm text-center max-w-[120px] sm:max-w-[160px] leading-tight truncate
                  ${
                      isDone
                          ? "text-[#3b2a1d] font-medium"
                          : isActive
                              ? "text-[#3b2a1d] font-semibold"
                              : "text-[#857567]"
                  }
                `}
                  title={step.label}
              >
                {step.label}
              </span>
                        </div>
                    )
                })}
            </div>
        </nav>
    )
}
