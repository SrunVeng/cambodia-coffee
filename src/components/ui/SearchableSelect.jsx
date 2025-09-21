import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

function cx(...c) { return c.filter(Boolean).join(" "); }

export default function SearchableSelect({
                                             items = [],                 // [{ value, label }]
                                             value = "",
                                             onChange,
                                             placeholder = "Select…",
                                             disabled = false,
                                             clearable = false,
                                             loading = false,
                                             size = "md",                // sm | md | lg
                                             className = "",
                                             // Overlay behavior
                                             portalToBody = true,
                                             menuZIndex = 4000,          // keep below your modal
                                             closeSignal = false,        // external “please close”
                                         }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [active, setActive] = useState(-1);
    const btnRef = useRef(null);
    const popRef = useRef(null);

    const tokens = {
        sm: { padd: "px-2 py-1.5", text: "text-sm" },
        md: { padd: "px-3 py-2",   text: "text-base" },
        lg: { padd: "px-4 py-2.5", text: "text-lg"  },
    }[size] || { padd: "px-3 py-2", text: "text-base" };

    const selected = useMemo(
        () => items.find((i) => String(i.value) === String(value)),
        [items, value]
    );

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        if (!qq) return items;
        return items.filter((i) => i.label?.toLowerCase().includes(qq));
    }, [items, q]);

    useEffect(() => { if (closeSignal) setOpen(false); }, [closeSignal]);

    // click outside
    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            const b = btnRef.current;
            const p = popRef.current;
            if (b?.contains(e.target) || p?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        window.addEventListener("scroll", onDoc, true);
        window.addEventListener("resize", onDoc, true);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            window.removeEventListener("scroll", onDoc, true);
            window.removeEventListener("resize", onDoc, true);
        };
    }, [open]);

    const pick = (val) => {
        onChange?.(val);
        setOpen(false);
        setQ("");
        setActive(-1);
    };

    const clear = (e) => {
        e.stopPropagation();
        pick("");
    };

    const onKey = (e) => {
        if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault(); setOpen(true); return;
        }
        if (!open) return;
        if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(filtered.length - 1, a + 1)); return; }
        if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); return; }
        if (e.key === "Enter") {
            e.preventDefault();
            const it = filtered[Math.max(0, active)];
            if (it) pick(it.value);
        }
    };

    // position popover under the trigger (fixed so it ignores parents' overflow)
    const [style, setStyle] = useState({});
    useEffect(() => {
        if (!open) return;
        const el = btnRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setStyle({
            position: "fixed",
            left: r.left + "px",
            top: r.bottom + 4 + "px",
            width: r.width + "px",
            zIndex: menuZIndex,
        });
    }, [open, menuZIndex]);

    const list = (
        <div
            ref={popRef}
            style={style}
            className={cx(
                "rounded-xl border border-[#e7dbc9] bg-white shadow-lg",
                open ? "block" : "hidden"
            )}
            role="listbox"
        >
            <div className="p-2">
                <input
                    autoFocus
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setActive(0); }}
                    placeholder="Search…"
                    className="w-full rounded-lg border border-[#e7dbc9] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c9a44c]"
                />
            </div>

            <div className="max-h-60 overflow-auto py-1">
                {loading ? (
                    <div className="px-3 py-2 text-sm text-[#6b5545]">Loading…</div>
                ) : filtered.length ? (
                    filtered.map((it, i) => (
                        <button
                            key={String(it.value)}
                            type="button"
                            role="option"
                            aria-selected={String(it.value) === String(value)}
                            onMouseEnter={() => setActive(i)}
                            onClick={() => pick(it.value)}
                            className={cx(
                                "block w-full text-left px-3 py-2 text-sm",
                                i === active ? "bg-[#fff6e6]" : "",
                                String(it.value) === String(value) ? "font-medium" : "text-[#3b2a1d]"
                            )}
                        >
                            {it.label}
                        </button>
                    ))
                ) : (
                    <div className="px-3 py-2 text-sm text-[#6b5545]">No results</div>
                )}
            </div>
        </div>
    );

    return (
        <div className={cx("relative", className)}>
            <button
                type="button"
                ref={btnRef}
                onClick={() => !disabled && setOpen((o) => !o)}
                onKeyDown={onKey}
                disabled={disabled}
                className={cx(
                    "flex w-full items-center justify-between rounded-xl border border-[#e7dbc9] bg-[#fffaf3] text-[#3b2a1d] shadow-sm",
                    tokens.padd,
                    disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-white",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#c9a44c]"
                )}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
        <span className={cx("truncate", tokens.text)}>
          {selected?.label || placeholder}
        </span>
                <span className="ml-2 flex items-center gap-1">
          {clearable && value && !disabled && (
              <span
                  onClick={clear}
                  title="Clear"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-md text-[#6b5545] hover:bg-[#f4eadb]"
              >
              ×
            </span>
          )}
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none">
            <path d="M6 9l6 6 6-6" strokeWidth="1.5" />
          </svg>
        </span>
            </button>

            {(portalToBody && typeof document !== "undefined")
                ? createPortal(list, document.body)
                : list}
        </div>
    );
}
