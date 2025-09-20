import { useEffect, useMemo, useRef, useState, useId, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

export default function Dropdown({
                                     items = [],
                                     value,
                                     onChange,
                                     getKey = (it) => it?.id ?? String(it),
                                     getLabel = (it) => it?.label ?? String(it),
                                     placeholder = "Select…",
                                     size = "md",                 // "sm" | "md" | "lg"
                                     className = "",
                                     disabled = false,
                                     align = "start",             // "start" | "end"
                                     maxMenuHeight = 288,
                                     portal = true,
                                 }) {
    const btnRef = useRef(null)
    const listRef = useRef(null)
    const menuRef = useRef(null)

    const [open, setOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const [coords, setCoords] = useState({ left: 0, top: 0, width: 0 })
    const [dropUp, setDropUp] = useState(false)

    const buttonId = useId()
    const listboxId = useId()

    const keys = useMemo(() => items.map(getKey).map(String), [items, getKey])
    const labels = useMemo(() => items.map(getLabel).map(String), [items, getLabel])
    const selectedIndex = useMemo(() => keys.indexOf(String(value)), [keys, value])
    const selectedLabel = selectedIndex >= 0 ? labels[selectedIndex] : ""

    const sizeCls =
        size === "sm" ? "h-9 text-sm px-3"
            : size === "lg" ? "h-12 text-base px-4"
                : "h-10 text-sm px-3.5"

    const place = () => {
        const btn = btnRef.current
        if (!btn) return
        const r = btn.getBoundingClientRect()
        const width = r.width
        const gap = 6
        let left = align === "end" ? r.right - width : r.left
        let top = r.bottom + gap

        // If there isn't enough space below, drop up.
        const vh = window.innerHeight
        const mh = menuRef.current?.getBoundingClientRect().height ?? 0
        const shouldDropUp = vh - r.bottom < mh + gap + 8
        if (shouldDropUp) top = r.top - gap - mh

        setDropUp(shouldDropUp)
        setCoords({ left, top, width })
    }

    const openMenu = () => {
        if (disabled || open) return
        setOpen(true)
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    }
    const closeMenu = () => setOpen(false)

    // Position on open and on window changes
    useLayoutEffect(() => { if (open) place() }, [open, align])
    useEffect(() => {
        if (!open) return
        const onWin = () => place()
        window.addEventListener("resize", onWin)
        window.addEventListener("scroll", onWin, true)
        return () => {
            window.removeEventListener("resize", onWin)
            window.removeEventListener("scroll", onWin, true)
        }
    }, [open])

    // Focus list after it renders
    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => listRef.current?.focus())
        }
    }, [open])

    // Click outside
    useEffect(() => {
        const onDoc = (e) => {
            if (!open) return
            const inBtn = btnRef.current?.contains(e.target)
            const inMenu = menuRef.current?.contains(e.target)
            if (!inBtn && !inMenu) closeMenu()
        }
        document.addEventListener("mousedown", onDoc)
        return () => document.removeEventListener("mousedown", onDoc)
    }, [open])

    const onKeyButton = (e) => {
        if (disabled) return
        if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
            e.preventDefault()
            openMenu()
        }
    }

    const onKeyList = (e) => {
        if (!open) return
        if (e.key === "Escape") { e.preventDefault(); closeMenu(); btnRef.current?.focus(); return }
        if (e.key === "Home")   { e.preventDefault(); setActiveIndex(0); return }
        if (e.key === "End")    { e.preventDefault(); setActiveIndex(items.length - 1); return }
        if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(items.length - 1, (i < 0 ? 0 : i + 1))); return }
        if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIndex((i) => Math.max(0, (i < 0 ? 0 : i - 1))); return }
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            if (activeIndex >= 0) { onChange?.(keys[activeIndex]); closeMenu(); btnRef.current?.focus() }
        }
    }

    const selectAt = (i) => { if (i >= 0 && i < items.length) { onChange?.(keys[i]); closeMenu(); btnRef.current?.focus() } }

    const Button = (
        <button
            id={buttonId}
            ref={btnRef}
            type="button"
            disabled={disabled}
            onClick={() => (open ? closeMenu() : openMenu())}
            onKeyDown={onKeyButton}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listboxId}
            className={`inline-flex items-center justify-between gap-2 rounded-xl border border-[var(--ring)] bg-white transition
        ${sizeCls} ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50 focus:ring-2 focus:ring-[var(--brand-accent)] outline-none"}
        ${open ? "rounded-b-md" : ""} ${className}`}
            title={selectedLabel || placeholder}
        >
      <span className={`truncate ${selectedLabel ? "text-gray-900" : "text-gray-400"}`}>
        {selectedLabel || placeholder}
      </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
    )

    const Menu = (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: dropUp ? 8 : -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: dropUp ? 8 : -8, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.6 }}
                    className="z-50"
                    style={portal ? {
                        position: "fixed",
                        left: coords.left,
                        top: coords.top,
                        width: coords.width,
                    } : {}}
                >
                    <div
                        role="listbox"
                        id={listboxId}
                        tabIndex={0}
                        aria-labelledby={buttonId}
                        ref={listRef}
                        onKeyDown={onKeyList}
                        className="max-h-[--mh] overflow-auto rounded-xl border border-[var(--ring)] bg-white shadow-lg focus:outline-none"
                        style={{ ["--mh"]: `${maxMenuHeight}px` }}
                    >
                        {items.map((it, i) => {
                            const k = keys[i]
                            const label = labels[i]
                            const selected = i === selectedIndex
                            const active = i === activeIndex
                            return (
                                <div
                                    key={k}
                                    role="option"
                                    aria-selected={selected}
                                    onMouseEnter={() => setActiveIndex(i)}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => selectAt(i)}
                                    className={`flex items-center gap-2 px-3.5 py-2.5 cursor-pointer select-none
                    ${active ? "bg-gray-50" : ""} ${selected ? "text-gray-900 font-medium" : "text-gray-700"}`}
                                >
                  <span className={`inline-flex h-4 w-4 items-center justify-center ${selected ? "opacity-100" : "opacity-0"}`}>
                    <Check className="h-4 w-4" />
                  </span>
                                    <span className="truncate">{label}</span>
                                </div>
                            )
                        })}
                        {items.length === 0 && (
                            <div className="px-3.5 py-2.5 text-gray-500 text-sm">No options</div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )

    // Render
    return (
        <div className="relative">
            {Button}
            {portal ? createPortal(Menu, document.body) : Menu}
        </div>
    )
}
