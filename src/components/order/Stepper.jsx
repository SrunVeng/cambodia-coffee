import React from "react"
import { motion } from "framer-motion"

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
                                }) {
    const items = steps.map((s, i) =>
        typeof s === "string" ? { id: i, label: s } : { id: s.id ?? i, label: s.label }
    )
    const last = Math.max(items.length - 1, 0)
    const safeActive = Math.min(Math.max(active, 0), last)

    const segCount = Math.max(items.length - 1, 0)
    const dotPx = size === "sm" ? 36 : 48
    const cols = []
    for (let i = 0; i < items.length; i++) {
        cols.push("var(--dot)")
        if (i < items.length - 1) cols.push("1fr")
    }

    const connectorState = (i) => {
        if (i < safeActive) return "full"
        if (i === safeActive && i < segCount && showPartial) return "half"
        return "empty"
    }

    return (
        <nav aria-label="Progress" className={`w-full bg-transparent ${className}`}>
            {/* Mobile helper */}
            <p className="sm:hidden mb-3 text-xs text-[#857567] text-center">
                {items.length ? `Step ${safeActive + 1} of ${items.length}` : "—"}
            </p>

            <div
                className="grid gap-y-2 sm:gap-y-3"
                style={{
                    gridTemplateColumns: cols.join(" "),
                    ["--dot"]: `${dotPx}px`,
                }}
            >
                {items.map((step, i) => {
                    const isDone = !!completed[i]
                    const isActive = i === safeActive
                    const wasVisited = lastVisited === i && !isActive
                    const canClick =
                        typeof onStepClick === "function" && (reachable[i] || i <= safeActive)

                    return (
                        <React.Fragment key={step.id}>
                            {/* DOT */}
                            <div className="row-start-1 col-span-1 flex items-center justify-center">
                                <motion.button
                                    type="button"
                                    whileHover={canClick ? { scale: 1.08 } : {}}
                                    whileTap={canClick ? { scale: 0.95 } : {}}
                                    animate={
                                        isActive
                                            ? { scale: 1.15, boxShadow: "0 0 0 4px rgba(201,164,76,0.4)" }
                                            : wasVisited
                                                ? { scale: 1.05, boxShadow: "0 0 0 3px rgba(75,46,36,0.3)" }
                                                : { scale: 1, boxShadow: "0 0 0 0px transparent" }
                                    }
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    onClick={() => (canClick ? onStepClick(i) : null)}
                                    disabled={!canClick}
                                    aria-current={isActive ? "step" : undefined}
                                    className={`flex items-center justify-center rounded-full border shadow-sm transition-colors
                    w-[var(--dot)] h-[var(--dot)]
                    ${
                                        isDone
                                            ? "bg-gradient-to-br from-[#4b2e24] to-[#2d1a14] text-white border-transparent"
                                            : isActive
                                                ? "bg-[#fffaf3] text-[#3b2a1d] border-[#c9a44c]"
                                                : wasVisited
                                                    ? "bg-[#fff8ef] text-[#3b2a1d] border-[#c9a44c]"
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
                                </motion.button>
                            </div>

                            {/* CONNECTOR */}
                            {i < segCount && (
                                <div className="row-start-1 col-span-1 flex items-center">
                                    <div className="w-full h-[2px] sm:h-[3px] rounded-full bg-[#e7dbc9] overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{
                                                width:
                                                    connectorState(i) === "full"
                                                        ? "100%"
                                                        : connectorState(i) === "half"
                                                            ? "50%"
                                                            : "0%",
                                                backgroundColor:
                                                    connectorState(i) === "half"
                                                        ? "#c9a44c"
                                                        : connectorState(i) === "full"
                                                            ? "#4b2e24"
                                                            : "#e7dbc9",
                                            }}
                                            transition={{ duration: 0.6, ease: "easeInOut" }}
                                        />
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}

                {/* Labels */}
                {items.map((step, i) => {
                    const isDone = !!completed[i]
                    const isActive = i === safeActive
                    const wasVisited = lastVisited === i && !isActive
                    return (
                        <div
                            key={`label-${step.id}`}
                            className="row-start-2 flex items-start justify-center"
                            style={{ gridColumn: `${i * 2 + 1} / span 1` }}
                        >
              <span
                  className={`text-xs sm:text-sm text-center max-w-[120px] sm:max-w-[160px] leading-tight truncate
                  ${
                      isActive
                          ? "text-[#2d1a14] font-bold"
                          : wasVisited
                              ? "text-[#c9a44c] font-medium"
                              : isDone
                                  ? "text-[#3b2a1d] font-medium"
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
