import React from "react";

/**
 * Stepper
 * - steps: string[] | { id?: string|number, label: string }[]
 * - active: number (0-based)
 * - completed?: boolean[]                 // which steps are finished
 * - maxReachable?: number                 // highest step index user can click
 * - onStepClick?: (index:number) => void
 * - className?: string
 */
export default function Stepper({
                                    steps = [],
                                    active = 0,
                                    completed,
                                    maxReachable,
                                    onStepClick,
                                    className = "",
                                }) {
    const items = steps.map((s, i) =>
        typeof s === "string" ? { id: i, label: s } : { id: s.id ?? i, label: s.label }
    );

    const safeActive = Math.min(Math.max(active, 0), Math.max(items.length - 1, 0));

    // If completed[] provided, default unlocked step = lastDone + 1
    const fallbackReachable =
        Array.isArray(completed) && completed.length
            ? Math.min(
                Math.max(completed.lastIndexOf(true) + 1, 0),
                Math.max(items.length - 1, 0)
            )
            : safeActive;

    const highestReachable =
        typeof maxReachable === "number" ? Math.max(0, Math.min(maxReachable, items.length - 1)) : fallbackReachable;

    return (
        <nav aria-label="Progress" className={`w-full ${className}`}>
            {/* Mobile helper text */}
            <p className="sm:hidden mb-2 text-[11px] text-slate-600">
                {items.length > 0
                    ? `Step ${Math.min(safeActive + 1, items.length)} of ${items.length}`
                    : "—"}
            </p>

            <ol
                role="list"
                className="
          flex items-center w-full
          gap-2 sm:gap-3
          px-1 sm:px-0
          overflow-x-auto sm:overflow-visible
          pb-1 sm:pb-0
          snap-x sm:snap-none snap-mandatory
          [scrollbar-width:none] [-ms-overflow-style:none]
        "
                style={{ scrollbarWidth: "none" }}
            >
                {items.map((step, i) => {
                    const isDone = Array.isArray(completed) ? !!completed[i] : i < safeActive;
                    const isActive = i === safeActive;
                    const canClick = typeof onStepClick === "function" && i <= highestReachable;

                    const circleBase =
                        "relative grid place-items-center rounded-full transition-all duration-300 shadow-sm border";
                    const circleSize = "w-9 h-9 sm:w-10 sm:h-10";
                    const circleTheme = isDone
                        ? "bg-gradient-to-br from-[#4b2e24] to-[#2d1a14] text-white border-transparent ring-1 ring-[#c9a44c]/60"
                        : isActive
                            ? "bg-[#fffaf3] text-[#3b2a1d] border-[#c9a44c] ring-2 ring-[#c9a44c]"
                            : "bg-[#fbf8f3] text-[#6b5545] border-[#e7dbc9]";

                    const labelTheme = isDone
                        ? "text-[#3b2a1d] font-medium"
                        : isActive
                            ? "text-[#3b2a1d] font-semibold"
                            : "text-[#857567]";

                    return (
                        <li
                            key={step.id}
                            className="
                flex items-center flex-1 min-w-[112px] sm:min-w-0
                snap-start sm:snap-none
              "
                        >
                            {/* Step node */}
                            <button
                                type="button"
                                title={step.label}
                                aria-current={isActive ? "step" : undefined}
                                aria-disabled={!canClick}
                                disabled={!canClick}
                                onClick={() => (canClick ? onStepClick(i) : null)}
                                className={`
                  group flex flex-col items-center flex-shrink-0
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#c9a44c]
                  !ring-offset-transparent
                  ${canClick ? "cursor-pointer" : "cursor-not-allowed opacity-70"}
                `}
                            >
                                {/* Circle */}
                                <div className={`${circleBase} ${circleSize} ${circleTheme}`}>
                                    {isDone ? (
                                        // Check icon for completed (brown highlight)
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            className="w-4 h-4 sm:w-5 sm:h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                    ) : (
                                        <span className="text-[11px] sm:text-[12px] font-bold">{i + 1}</span>
                                    )}

                                    {/* Subtle coffee-bean accent for active */}
                                    {isActive && (
                                        <span
                                            aria-hidden="true"
                                            className="
                        pointer-events-none absolute -bottom-2 sm:-bottom-2.5
                        w-3 h-2 sm:w-3.5 sm:h-2.5
                        rotate-12 rounded-full
                        bg-[#c9a44c]/90
                        shadow-[0_1px_2px_rgba(0,0,0,.15)]
                      "
                                            style={{
                                                boxShadow:
                                                    "inset 0 0 0.5px rgba(0,0,0,.25), 0 1px 2px rgba(0,0,0,.18)",
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Label */}
                                <div
                                    className={`
                    mt-1.5 sm:mt-2 text-[11px] sm:text-[13px] leading-tight text-center
                    ${labelTheme}
                    px-2 max-w-[140px]
                  `}
                                >
                                    <span className="block line-clamp-2">{step.label}</span>
                                </div>
                            </button>

                            {/* Connector */}
                            {i < items.length - 1 && (
                                <div className="flex-1 flex items-center mx-2 sm:mx-3">
                                    {/* Track */}
                                    <div className="relative w-full h-[2px] sm:h-[3px] rounded-full bg-[#efe6d6]">
                                        {/* Fill (done = left step completed) */}
                                        <div
                                            className={`
                        absolute inset-y-0 left-0 rounded-full transition-all duration-500
                        ${isDone ? "w-full bg-[#4b2e24]" : "w-0"}
                      `}
                                        />
                                        {/* Half-fill into the active step for a subtle cue */}
                                        {isActive && !isDone && (
                                            <div className="absolute inset-y-0 left-0 w-1/2 sm:w-2/3 rounded-full bg-gradient-to-r from-[#4b2e24] to-[#7a533f] transition-all duration-500" />
                                        )}
                                    </div>

                                    <div className="hidden sm:block ml-2 w-1.5 h-1.5 rounded-full bg-[#e7dbc9]" />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
