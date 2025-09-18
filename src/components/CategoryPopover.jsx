import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Tag, X } from "lucide-react";

export default function CategoryPopover({
                                            open,
                                            categories = [],
                                            value,
                                            onChange,
                                            onClose,
                                            translateCat, // (key) => localized label; expects "all" and category keys
                                        }) {
    const popoverRef = useRef(null);
    const itemRefs = useRef([]);
    const [focusIndex, setFocusIndex] = useState(0);

    // Ensure unique list and keep "all" (if present) pinned to the top.
    const list = useMemo(() => {
        const uniq = Array.from(new Set(categories.filter(Boolean)));
        const i = uniq.indexOf("all");
        if (i > 0) {
            uniq.splice(i, 1);
            uniq.unshift("all");
        }
        return uniq;
    }, [categories]);

    // Find initial focus (selected or first)
    useEffect(() => {
        if (!open) return;
        const idx = Math.max(0, list.indexOf(value));
        setFocusIndex(idx === -1 ? 0 : idx);
        // focus the selected item on open
        requestAnimationFrame(() => itemRefs.current[idx]?.focus());
    }, [open, value, list]);

    // Click outside & Esc to close
    useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
            if (!popoverRef.current?.contains(e.target)) onClose?.();
        };
        const onDocKey = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onDocKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onDocKey);
        };
    }, [open, onClose]);

    const labelOf = (c) => {
        if (c === "all") return translateCat?.("all") ?? "All";
        // fallback: Title Case
        const fallback = c.charAt(0).toUpperCase() + c.slice(1);
        return translateCat?.(c) ?? fallback;
    };

    const ensureVisible = (i) => {
        const el = itemRefs.current[i];
        if (el) el.scrollIntoView({ block: "nearest" });
    };

    const moveFocus = (delta) => {
        const n = list.length;
        if (n === 0) return;
        let i = (focusIndex + delta + n) % n;
        setFocusIndex(i);
        itemRefs.current[i]?.focus();
        ensureVisible(i);
    };

    const onKeyDown = (e) => {
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                moveFocus(1);
                break;
            case "ArrowUp":
                e.preventDefault();
                moveFocus(-1);
                break;
            case "Home":
                e.preventDefault();
                setFocusIndex(0);
                itemRefs.current[0]?.focus();
                ensureVisible(0);
                break;
            case "End":
                e.preventDefault();
                setFocusIndex(list.length - 1);
                itemRefs.current[list.length - 1]?.focus();
                ensureVisible(list.length - 1);
                break;
            case "Enter":
            case " ":
                e.preventDefault();
                onChange?.(list[focusIndex]);
                onClose?.();
                break;
            default:
                break;
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="absolute top-12 right-0 z-50">
                    <motion.div
                        ref={popoverRef}
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="
              w-64 rounded-2xl border border-[#e7dbc9] bg-[#fffaf3] shadow-xl ring-1 ring-black/5
              overflow-hidden
            "
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2">
                            <div className="text-xs uppercase tracking-wide text-[#857567]">
                                {translateCat?.("category") ?? "Category"}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-md text-[#6b5545] hover:bg-[#f6efe3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44c] focus-visible:ring-offset-2"
                                aria-label={translateCat?.("close") ?? "Close"}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="h-px bg-[#e7dbc9]" />

                        {/* List */}
                        <div
                            role="listbox"
                            aria-activedescendant={`cat-item-${focusIndex}`}
                            className="max-h-64 overflow-auto p-2"
                            onKeyDown={onKeyDown}
                            tabIndex={-1} // container itself doesn't grab focus; items do
                        >
                            {list.map((c, idx) => {
                                const selected = value === c;
                                return (
                                    <button
                                        key={c}
                                        id={`cat-item-${idx}`}
                                        role="option"
                                        aria-selected={selected}
                                        type="button"
                                        ref={(el) => (itemRefs.current[idx] = el)}
                                        onClick={() => {
                                            onChange?.(c);
                                            onClose?.();
                                        }}
                                        className={[
                                            "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-[#2d1a14]",
                                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44c]",
                                            selected
                                                ? "bg-[#2d1a14] text-white"
                                                : "hover:bg-[#f6efe3]",
                                        ].join(" ")}
                                    >
                                        <Check className={`h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`} />
                                        <Tag className={`h-4 w-4 ${selected ? "opacity-80" : "text-[#6b5545]"}`} />
                                        <span className="truncate">{labelOf(c)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
