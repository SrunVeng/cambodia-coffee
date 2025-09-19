import React, { useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * Reusable searchable select (no native <select>)
 * Props:
 * - items: Array<{ value: string, label: string }>
 * - value: string | undefined
 * - onChange: (val: string | undefined, item?: any) => void
 * - placeholder?: string
 * - disabled?: boolean
 * - noResultsText?: string
 * - className?: string (applies to trigger)
 * - size?: "sm" | "md" | "lg"
 * - clearable?: boolean
 * - renderItem?: (item, active, selected) => ReactNode
 */
export default function SearchableSelect({
                                             items = [],
                                             value,
                                             onChange,
                                             placeholder = "Select…",
                                             disabled = false,
                                             noResultsText = "No results",
                                             className = "",
                                             size = "md",
                                             clearable = false,
                                             renderItem,
                                         }) {
    const buttonRef = useRef(null);
    const popRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);

    const id = useId();
    const labelId = `sel-label-${id}`;
    const listboxId = `sel-list-${id}`;

    const selectedIndex = useMemo(
        () => items.findIndex((it) => it.value === value),
        [items, value]
    );

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return items;
        return items.filter((it) => it.label.toLowerCase().includes(term));
    }, [items, q]);

    useEffect(() => {
        if (!open) return;
        // focus search on open
        const t = setTimeout(() => inputRef.current?.focus(), 1);
        return () => clearTimeout(t);
    }, [open]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
            if (
                popRef.current?.contains(e.target) ||
                buttonRef.current?.contains(e.target)
            ) {
                return;
            }
            setOpen(false);
            setQ("");
            setActiveIndex(-1);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);

    // Ensure active item stays in view
    useEffect(() => {
        if (!open || activeIndex < 0) return;
        const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
        el?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, open]);

    const sizes = {
        sm: "h-9 text-sm px-3",
        md: "h-10 text-sm px-3.5",
        lg: "h-11 text-base px-4",
    };

    const selectedLabel = value
        ? items.find((it) => it.value === value)?.label
        : "";

    const handleCommit = (it) => {
        onChange?.(it?.value, it);
        setOpen(false);
        setQ("");
        setActiveIndex(-1);
        buttonRef.current?.focus();
    };

    const handleKeyOnTrigger = (e) => {
        if (disabled) return;
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 1);
            setActiveIndex(Math.max(0, selectedIndex));
        }
        if (clearable && (e.key === "Backspace" || e.key === "Delete") && value) {
            e.preventDefault();
            onChange?.(undefined, undefined);
        }
    };

    const handleKeyOnList = (e) => {
        if (!open) return;
        if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            setQ("");
            setActiveIndex(-1);
            buttonRef.current?.focus();
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            const item = filtered[activeIndex];
            if (item) handleCommit(item);
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

    return (
        <div className="relative">
            {/* Trigger */}
            <button
                type="button"
                ref={buttonRef}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-labelledby={labelId}
                onClick={() => !disabled && setOpen((o) => !o)}
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
              <svg
                  onClick={(e) => {
                      e.stopPropagation();
                      onChange?.(undefined, undefined);
                  }}
                  className="w-4 h-4 opacity-70 hover:opacity-100"
                  viewBox="0 0 24 24"
              >
                  <path
                      d="M15 9L9 15M9 9l6 6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                  />
              </svg>
          ) : null}
                    <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </svg>
        </span>
            </button>

            {/* Popover */}
            {open && (
                <div
                    ref={popRef}
                    role="dialog"
                    aria-modal="false"
                    className="absolute z-50 mt-1 w-full rounded-xl border border-[rgba(78,54,42,0.20)] bg-[#fffaf3] shadow-xl ring-1 ring-[rgba(60,44,33,0.10)]"
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
                            placeholder="Search…"
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
                            <li
                                role="option"
                                aria-disabled="true"
                                className="px-3 py-2 text-sm text-[#8b7968]"
                            >
                                {noResultsText}
                            </li>
                        ) : (
                            filtered.map((it, idx) => {
                                const selected = it.value === value;
                                const active = idx === activeIndex;
                                return (
                                    <li
                                        key={it.value}
                                        data-idx={idx}
                                        role="option"
                                        aria-selected={selected}
                                        onMouseEnter={() => setActiveIndex(idx)}
                                        onMouseDown={(e) => e.preventDefault()} // keep focus
                                        onClick={() => handleCommit(it)}
                                        className={[
                                            "cursor-pointer px-3 py-2 text-sm",
                                            "text-[#3b2a1d]",
                                            active ? "bg-[#f3e8db]" : "",
                                            selected ? "font-semibold" : "",
                                            "flex items-center justify-between gap-3",
                                        ].join(" ")}
                                    >
                    <span>
                      {renderItem ? renderItem(it, active, selected) : it.label}
                    </span>
                                        {selected ? (
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                                                <path
                                                    d="M5 13l4 4L19 7"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    fill="none"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        ) : null}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
