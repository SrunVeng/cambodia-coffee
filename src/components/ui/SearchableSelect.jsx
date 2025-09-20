import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * SearchableSelect – accessible, portal-based popover select with keyboard support.
 *
 * Props
 * - items: Array<{ value: string, label: string }>
 * - value?: string
 * - onChange?: (val: string | undefined, item?: any) => void
 * - placeholder?: string
 * - disabled?: boolean
 * - noResultsText?: string
 * - className?: string               // applied to the trigger button
 * - menuClassName?: string           // applied to the popover panel
 * - size?: "sm" | "md" | "lg"
 * - clearable?: boolean
 * - renderItem?: (item, active, selected) => React.ReactNode
 * - searchPlaceholder?: string
 * - autoFocusSearch?: boolean        // default true
 * - filterFn?: (item, term: string) => boolean
 * - onOpenChange?: (open: boolean) => void
 * - portalTo?: HTMLElement | null    // default: document.body
 * - portalZIndex?: number            // default: 9999
 * - placement?: "auto" | "bottom" | "top"
 * - offset?: number                  // default: 6px spacing from trigger
 */
export default function SearchableSelect({
                                             items = [],
                                             value,
                                             onChange,
                                             placeholder = "Select…",
                                             disabled = false,
                                             noResultsText = "No results",
                                             className = "",
                                             menuClassName = "",
                                             size = "md",
                                             clearable = false,
                                             renderItem,
                                             searchPlaceholder = "Search…",
                                             autoFocusSearch = true,
                                             filterFn,
                                             onOpenChange,
                                             portalTo,
                                             portalZIndex = 9999,
                                             placement = "auto",
                                             offset = 6,
                                         }) {
    const buttonRef = useRef(null);
    const popRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);
    const [computedPlacement, setComputedPlacement] = useState(placement);
    const [menuStyle, setMenuStyle] = useState({});

    const id = useId();
    const labelId = `sel-label-${id}`;
    const listboxId = `sel-list-${id}`;

    const selectedIndex = useMemo(
        () => items.findIndex((it) => it.value === value),
        [items, value]
    );

    const filter = useMemo(() => {
        if (filterFn) return filterFn;
        return (it, term) => it.label.toLowerCase().includes(term);
    }, [filterFn]);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return items;
        return items.filter((it) => filter(it, term));
    }, [items, q, filter]);

    const selectedLabel = value ? items.find((it) => it.value === value)?.label : "";

    const sizes = {
        sm: "h-9 text-sm px-3",
        md: "h-10 text-sm px-3.5",
        lg: "h-11 text-base px-4",
    };

    const openMenu = () => {
        if (disabled || open) return;
        setOpen(true);
        setActiveIndex(Math.max(0, selectedIndex));
        onOpenChange?.(true);
    };

    const closeMenu = (focusTrigger = true) => {
        if (!open) return;
        setOpen(false);
        setQ("");
        setActiveIndex(-1);
        onOpenChange?.(false);
        if (focusTrigger) buttonRef.current?.focus();
    };

    const handleCommit = (it) => {
        onChange?.(it?.value, it);
        closeMenu(true);
    };

    const handleKeyOnTrigger = (e) => {
        if (disabled) return;
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openMenu();
            // focus search shortly after render
            setTimeout(() => inputRef.current?.focus(), 1);
        }
        if (clearable && (e.key === "Backspace" || e.key === "Delete") && value) {
            e.preventDefault();
            onChange?.(undefined, undefined);
        }
        // quick type-to-open
        if (!open && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            openMenu();
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.value = e.key;
                    setQ(e.key);
                    inputRef.current.focus();
                }
            }, 1);
        }
    };

    const handleKeyOnList = (e) => {
        if (!open) return;
        if (e.key === "Escape") {
            e.preventDefault();
            closeMenu(true);
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            const item = filtered[activeIndex];
            if (item) handleCommit(item);
            return;
        }
        if (e.key === "Tab") {
            // Close on tab, keep focus moving naturally
            closeMenu(false);
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(filtered.length - 1, (i < 0 ? -1 : i) + 1));
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(0, (i < 0 ? 0 : i) - 1));
            return;
        }
        if (e.key === "Home") {
            e.preventDefault();
            setActiveIndex(0);
            return;
        }
        if (e.key === "End") {
            e.preventDefault();
            setActiveIndex(filtered.length - 1);
            return;
        }
    };

    // focus search on open
    useEffect(() => {
        if (!open || !autoFocusSearch) return;
        const t = setTimeout(() => inputRef.current?.focus(), 1);
        return () => clearTimeout(t);
    }, [open, autoFocusSearch]);

    // outside click (works with portal)
    useEffect(() => {
        if (!open) return;
        const onDocPointer = (e) => {
            if (popRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) {
                return;
            }
            closeMenu(false);
        };
        document.addEventListener("pointerdown", onDocPointer, true);
        return () => document.removeEventListener("pointerdown", onDocPointer, true);
    }, [open]);

    // keep active item in view
    useEffect(() => {
        if (!open || activeIndex < 0) return;
        const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
        el?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, open, filtered.length]);

    // positioning (fixed, portal to body)
    const portalTarget = typeof document !== "undefined" ? (portalTo || document.body) : null;

    const computePosition = () => {
        const btn = buttonRef.current;
        const panel = popRef.current;
        if (!btn || !panel) return;
        const r = btn.getBoundingClientRect();
        const viewH = window.innerHeight || document.documentElement.clientHeight;
        const panelH = panel.offsetHeight || 240; // rough fallback before paint
        let want = placement;

        if (placement === "auto") {
            const spaceBelow = viewH - r.bottom - offset;
            const spaceAbove = r.top - offset;
            want = spaceBelow >= Math.min(panelH, 200) || spaceBelow >= spaceAbove ? "bottom" : "top";
        }

        const top = want === "bottom" ? r.bottom + offset : Math.max(offset, r.top - panelH - offset);

        setComputedPlacement(want);
        setMenuStyle({
            position: "fixed",
            top: `${Math.round(top)}px`,
            left: `${Math.round(r.left)}px`,
            width: `${Math.round(r.width)}px`,
            zIndex: portalZIndex,
        });
    };

    useLayoutEffect(() => {
        if (!open) return;
        computePosition();

        const onScroll = () => computePosition();
        const onResize = () => computePosition();
        window.addEventListener("scroll", onScroll, true);
        window.addEventListener("resize", onResize);
        const ro = new ResizeObserver(() => computePosition());
        if (buttonRef.current) ro.observe(buttonRef.current);

        return () => {
            window.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", onResize);
            ro.disconnect();
        };
    }, [open, placement, offset, portalZIndex]);

    return (
        <div className="relative">
            {/* Trigger */}
            <button
                type="button"
                ref={buttonRef}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listboxId : undefined}
                aria-labelledby={labelId}
                onClick={() => (open ? closeMenu(true) : openMenu())}
                onKeyDown={handleKeyOnTrigger}
                disabled={disabled}
                className={[
                    "w-full rounded-xl border text-left",
                    "border-[#e7dbc9] bg-[#fffaf3] text-[#3b2a1d] placeholder-[#9b8b7c] shadow-sm",
                    "focus:outline-none focus:ring-2 focus:ring-[#c9a44c] focus:border-[#c9a44c]",
                    "disabled:bg-[#f2ede5] disabled:text-[#9b8b7c]",
                    "inline-flex items-center justify-between gap-2",
                    sizes[size],
                    className,
                ].join(" ")}
            >
        <span id={labelId} className={selectedLabel ? "" : "text-[#9b8b7c]"}>
          {selectedLabel || placeholder}
        </span>
                <span className="flex items-center gap-1">
          {clearable && value ? (
              <button
                  type="button"
                  aria-label="Clear selection"
                  onClick={(e) => {
                      e.stopPropagation();
                      onChange?.(undefined, undefined);
                  }}
                  className="p-1 rounded hover:bg-[rgba(60,44,33,0.06)] focus:outline-none focus:ring-2 focus:ring-[#c9a44c]"
              >
                  <svg className="w-4 h-4 opacity-70 hover:opacity-100" viewBox="0 0 24 24">
                      <path d="M15 9L9 15M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
              </button>
          ) : null}
                    <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </svg>
        </span>
            </button>

            {/* Popover (portal) */}
            {open && portalTarget
                ? createPortal(
                    <div
                        ref={popRef}
                        role="dialog"
                        aria-modal="false"
                        style={{ position: "fixed", inset: 0, zIndex: portalZIndex, pointerEvents: "none" }}
                    >
                        <div
                            role="presentation"
                            style={{ ...menuStyle, pointerEvents: "auto" }}
                            className={[
                                "mt-1 rounded-xl border border-[rgba(78,54,42,0.20)] bg-[#fffaf3] shadow-xl ring-1 ring-[rgba(60,44,33,0.10)]",
                                computedPlacement === "top" ? "origin-bottom animate-[popIn_120ms_ease-out]" : "origin-top animate-[popIn_120ms_ease-out]",
                                menuClassName,
                            ].join(" ")}
                            onKeyDown={handleKeyOnList}
                        >
                            {/* Search */}
                            <div className="p-2 border-b border-[rgba(78,54,42,0.12)]">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={q}
                                    onChange={(e) => {
                                        setQ(e.target.value);
                                        setActiveIndex(0);
                                    }}
                                    placeholder={searchPlaceholder}
                                    className="w-full rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#3b2a1d] placeholder-[#9b8b7c] focus:outline-none focus:ring-2 focus:ring-[#c9a44c] focus:border-[#c9a44c]"
                                />
                            </div>

                            {/* List */}
                            <ul
                                id={listboxId}
                                role="listbox"
                                aria-labelledby={labelId}
                                tabIndex={-1}
                                ref={listRef}
                                className="max-h-64 overflow-auto py-1"
                            >
                                {filtered.length === 0 ? (
                                    <li role="option" aria-disabled="true" className="px-3 py-2 text-sm text-[#8b7968]">
                                        {noResultsText}
                                    </li>
                                ) : (
                                    filtered.map((it, idx) => {
                                        const selected = it.value === value;
                                        const active = idx === activeIndex;
                                        return (
                                            <li
                                                key={it.value}
                                                id={`opt-${id}-${idx}`}
                                                data-idx={idx}
                                                role="option"
                                                aria-selected={selected}
                                                onMouseEnter={() => setActiveIndex(idx)}
                                                onMouseDown={(e) => e.preventDefault()} // keep focus in input
                                                onClick={() => handleCommit(it)}
                                                className={[
                                                    "cursor-pointer px-3 py-2 text-sm",
                                                    "text-[#3b2a1d]",
                                                    active ? "bg-[#f3e8db]" : "",
                                                    selected ? "font-semibold" : "",
                                                    "flex items-center justify-between gap-3",
                                                ].join(" ")}
                                            >
                                                <span>{renderItem ? renderItem(it, active, selected) : it.label}</span>
                                                {selected ? (
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                                                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                                                    </svg>
                                                ) : null}
                                            </li>
                                        );
                                    })
                                )}
                            </ul>
                        </div>
                    </div>,
                    portalTarget
                )
                : null}

            {/* animations */}
            <style jsx>{`
        @keyframes popIn {
          from { transform: scaleY(0.98); opacity: 0; }
          to { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
