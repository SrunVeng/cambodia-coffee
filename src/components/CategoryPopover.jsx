import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Tag, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import cats from "../data/product-categories.json"; // [{ id, name: { en, kh, cn } }]

export default function CategoryPopover({
                                            open,
                                            categories = [],
                                            value,
                                            onChange,
                                            onClose,
                                            translateCat, // optional; if omitted, built-in i18n is used
                                        }) {
    const panelRef = useRef(null);
    const listboxRef = useRef(null);
    const [focusIndex, setFocusIndex] = useState(0);

    const { t, i18n } = useTranslation();

    const normalizeLang = (lang = "en") => {
        const l = (lang || "en").toLowerCase();
        if (l === "km") return "kh";
        if (l === "zh") return "cn";
        return ["en", "kh", "cn"].includes(l) ? l : "en";
    };
    const L = useMemo(() => normalizeLang(i18n.language), [i18n.language]);

    // Build: id -> {en,kh,cn}
    const catMap = useMemo(() => {
        const m = new Map();
        (cats || []).forEach((c) => m.set(c.id, c.name || {}));
        return m;
    }, []);

    // Translator (uses prop if provided, else our i18n-aware default)
    const tcat = useMemo(() => {
        if (translateCat) return translateCat;

        const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

        return (key) => {
            if (key === "category") return t("products.category", { defaultValue: "Category" });
            if (key === "close") return t("common.close", { defaultValue: "Close" });
            if (key === "all") return t("products.all", { defaultValue: "All" });

            const nameObj = catMap.get(key);
            if (nameObj) return nameObj[L] ?? nameObj.en ?? cap(key);
            return cap(key);
        };
    }, [translateCat, catMap, L, t]);

    // Ensure unique list; keep "all" on top if present
    const list = useMemo(() => {
        const uniq = Array.from(new Set(categories.filter(Boolean)));
        const i = uniq.indexOf("all");
        if (i > 0) {
            uniq.splice(i, 1);
            uniq.unshift("all");
        }
        return uniq;
    }, [categories]);

    // Clamp focusIndex when list length changes
    useEffect(() => {
        setFocusIndex((i) => Math.min(Math.max(i, 0), Math.max(0, list.length - 1)));
    }, [list.length]);

    // When opened or value changes, move focus to selected (or first)
    useEffect(() => {
        if (!open) return;
        const sel = list.indexOf(value);
        const idx = sel === -1 ? 0 : sel;
        setFocusIndex(idx);

        const id = requestAnimationFrame(() => {
            listboxRef.current?.focus();
            document.getElementById(`cat-item-${idx}`)?.scrollIntoView({ block: "nearest" });
        });
        return () => cancelAnimationFrame(id);
    }, [open, value, list]);

    // Outside click & Esc to close
    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e) => {
            if (!panelRef.current?.contains(e.target)) onClose?.();
        };
        const onDocKey = (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                onClose?.();
            }
        };
        document.addEventListener("pointerdown", onPointerDown, { capture: true });
        document.addEventListener("keydown", onDocKey, { capture: true });
        return () => {
            document.removeEventListener("pointerdown", onPointerDown, { capture: true });
            document.removeEventListener("keydown", onDocKey, { capture: true });
        };
    }, [open, onClose]);

    const ensureVisible = (i) => {
        document.getElementById(`cat-item-${i}`)?.scrollIntoView({ block: "nearest" });
    };

    const moveFocus = (delta) => {
        if (!list.length) return;
        const n = list.length;
        const i = (focusIndex + delta + n) % n;
        setFocusIndex(i);
        ensureVisible(i);
    };

    const onListKeyDown = (e) => {
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
                ensureVisible(0);
                break;
            case "End":
                e.preventDefault();
                setFocusIndex(list.length - 1);
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

    const headerId = "category-popover-header";

    return (
        <AnimatePresence>
            {open && (
                <div className="absolute top-12 right-0 z-50">
                    <motion.div
                        ref={panelRef}
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="w-64 rounded-2xl border border-[#e7dbc9] bg-[#fffaf3] shadow-xl ring-1 ring-black/5 overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={headerId}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2">
                            <div id={headerId} className="text-xs uppercase tracking-wide text-[#857567]">
                                {tcat("category")}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-md text-[#6b5545] hover:bg-[#f6efe3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44c] focus-visible:ring-offset-2"
                                aria-label={tcat("close")}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="h-px bg-[#e7dbc9]" />

                        {/* Listbox */}
                        <div
                            ref={listboxRef}
                            role="listbox"
                            tabIndex={0}
                            aria-activedescendant={`cat-item-${focusIndex}`}
                            className="max-h-64 overflow-auto p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44c]"
                            onKeyDown={onListKeyDown}
                        >
                            {list.map((c, idx) => {
                                const selected = value === c;
                                return (
                                    <div
                                        key={c}
                                        id={`cat-item-${idx}`}
                                        role="option"
                                        aria-selected={selected}
                                        className={[
                                            "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm cursor-pointer",
                                            selected ? "bg-[#2d1a14] text-white" : "text-[#2d1a14] hover:bg-[#f6efe3]",
                                        ].join(" ")}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            onChange?.(c);
                                            onClose?.();
                                        }}
                                    >
                                        <Check className={`h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`} />
                                        <Tag className={`h-4 w-4 ${selected ? "opacity-80" : "text-[#6b5545]"}`} />
                                        <span className="truncate">{tcat(c)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
