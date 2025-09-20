import { useEffect, useMemo, useRef, useState, useId } from "react"
import { ChevronDown, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function VariantPicker({
                                          variants = [],              // [{ id, label, delta }]
                                          basePrice = 0,
                                          currency = "USD",
                                          value,
                                          onChange,
                                          placeholder = "Choose weight",
                                          className = "",
                                          size = "md",                // "sm" | "md" | "lg"
                                      }) {
    const [open, setOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const btnRef = useRef(null)
    const popRef = useRef(null)
    const listRef = useRef(null)
    const uid = useId()

    const pad = size === "sm" ? "px-2 py-1.5" : size === "lg" ? "px-4 py-2.5" : "px-3 py-2"
    const text = size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm"
    const fmt = (n) => new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n)

    const selectedIndex = useMemo(() => variants.findIndex(v => v.id === value), [variants, value])

    // Close on outside click / touch
    useEffect(() => {
        const onDoc = (e) => {
            if (!open) return
            if (!popRef.current || !btnRef.current) return
            if (!popRef.current.contains(e.target) && !btnRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener("mousedown", onDoc)
        document.addEventListener("touchstart", onDoc)
        return () => {
            document.removeEventListener("mousedown", onDoc)
            document.removeEventListener("touchstart", onDoc)
        }
    }, [open])

    // Keyboard interactions
    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            const last = variants.length - 1
            if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); }
            else if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min((i < 0 ? selectedIndex : i) + 1, last)) }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max((i < 0 ? selectedIndex : i) - 1, 0)) }
            else if (e.key === "Home") { e.preventDefault(); setActiveIndex(0) }
            else if (e.key === "End") { e.preventDefault(); setActiveIndex(last) }
            else if (e.key === "Enter") {
                if (activeIndex >= 0) {
                    const v = variants[activeIndex]
                    onChange?.(v.id)
                    setOpen(false)
                    btnRef.current?.focus()
                }
            }
        }
        document.addEventListener("keydown", onKey)
        return () => document.removeEventListener("keydown", onKey)
    }, [open, activeIndex, selectedIndex, variants, onChange])

    // When opening, preselect current
    useEffect(() => {
        if (open) setActiveIndex(Math.max(selectedIndex, 0))
    }, [open, selectedIndex])

    // Keep the active option in view
    useEffect(() => {
        if (!open || activeIndex < 0) return
        const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`)
        el?.scrollIntoView({ block: "nearest" })
    }, [activeIndex, open])

    return (
        <div className={`relative ${className}`}>
            <motion.button
                ref={btnRef}
                type="button"
                onClick={() => setOpen(o => !o)}
                whileTap={{ scale: 0.98 }}
                className={`inline-flex items-center justify-between gap-2 rounded-lg border border-[var(--ring)] bg-white ${pad} ${text} w-full transition-shadow focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]`}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={`vp-${uid}-list`}
            >
                <span className="truncate">{variants.find(v => v.id === value)?.label || placeholder}</span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <ChevronDown className="h-4 w-4 opacity-70" />
                </motion.span>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        ref={popRef}
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--ring)] bg-white shadow-xl overflow-hidden"
                        role="listbox"
                        id={`vp-${uid}-list`}
                        tabIndex={-1}
                    >
                        <div ref={listRef} className="max-h-64 overflow-auto overscroll-contain">
                            {variants.map((v, i) => {
                                const price = basePrice + (v.delta || 0)
                                const selected = v.id === value
                                const active = i === activeIndex
                                return (
                                    <button
                                        key={v.id}
                                        type="button"
                                        role="option"
                                        aria-selected={selected}
                                        data-idx={i}
                                        onMouseEnter={() => setActiveIndex(i)}
                                        onClick={() => { onChange?.(v.id); setOpen(false); btnRef.current?.focus() }}
                                        className={`w-full text-left px-3 py-2 flex items-center justify-between ${
                                            active ? "bg-stone-50" : selected ? "bg-[var(--brand-accent)]/10" : "hover:bg-stone-50"
                                        }`}
                                    >
                    <span className="truncate flex items-center gap-2">
                      {selected && <Check className="h-4 w-4 shrink-0" />}
                        {v.label}
                    </span>
                                        <span className="ml-3 shrink-0 text-sm opacity-70">{fmt(price)}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
