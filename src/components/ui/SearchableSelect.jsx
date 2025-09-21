import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
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
                                             // Overlay / portal behavior
                                             portalToBody = true,
                                             menuZIndex = 4000,
                                             closeSignal = false,        // external “please close”
                                             searchPlaceholder = "Search…",
                                         }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [active, setActive] = useState(-1);
    const [openUp, setOpenUp] = useState(false);
    const [maxListHeight, setMaxListHeight] = useState(260);

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
        return items.filter((i) => (i.label || "").toLowerCase().includes(qq));
    }, [items, q]);

    useEffect(() => { if (closeSignal) setOpen(false); }, [closeSignal]);

    // ----- positioning (fixed, relative to viewport) -----
    const [style, setStyle] = useState({});
    const reposition = () => {
        const el = btnRef.current;
        if (!el) return;

        const r = el.getBoundingClientRect();
        const vw = window.innerWidth || document.documentElement.clientWidth;
        const vh = window.innerHeight || document.documentElement.clientHeight;

        const gap = 6; // space between trigger and menu
        const below = vh - r.bottom;
        const above = r.top;

        const wantOpenUp = below < 220 && above > below; // heuristic threshold
        setOpenUp(wantOpenUp);

        const maxH = Math.max(160, Math.min(wantOpenUp ? (r.top - 8) : (vh - r.bottom - 8), 340));
        setMaxListHeight(maxH);

        const left = Math.min(Math.max(8, r.left), vw - 8); // clamp inside viewport with 8px gutters
        const width = Math.min(r.width, vw - 16);

        setStyle({
            position: "fixed",
            left: `${left}px`,
            top: wantOpenUp ? `${r.top}px` : `${r.bottom + gap}px`,
            width: `${width}px`,
            zIndex: menuZIndex,
            transform: wantOpenUp ? "translateY(-100%)" : "none",
        });
    };

    useLayoutEffect(() => {
        if (!open) return;

        // Initial pass
        reposition();

        // Reposition on viewport changes / scrolling
        const onScroll = () => reposition();
        const onResize = () => reposition();
        const onTransEnd = () => reposition();

        window.addEventListener("scroll", onScroll, true);
        window.addEventListener("resize", onResize, true);
        window.addEventListener("orientationchange", onResize, true);
        window.addEventListener("transitionend", onTransEnd, true);

        // Reposition if trigger size/position changes
        let ro;
        if ("ResizeObserver" in window && btnRef.current) {
            ro = new ResizeObserver(reposition);
            ro.observe(btnRef.current);
        }

        // Fonts can shift metrics on load
        const fontReady = document.fonts?.ready;
        if (fontReady && typeof fontReady.then === "function") fontReady.then(reposition).catch(() => {});

        return () => {
            window.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", onResize, true);
            window.removeEventListener("orientationchange", onResize, true);
            window.removeEventListener("transitionend", onTransEnd, true);
            if (ro) ro.disconnect();
        };
    }, [open, menuZIndex]);

    // click outside & ESC
    useEffect(() => {
        if (!open) return;

        const onDoc = (e) => {
            const b = btnRef.current;
            const p = popRef.current;
            if (b?.contains(e.target) || p?.contains(e.target)) return;
            setOpen(false);
        };
        const onKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
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
        if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(filtered.length - 1, (a < 0 ? 0 : a + 1))); return; }
        if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, (a < 0 ? 0 : a - 1))); return; }
        if (e.key === "Enter") {
            e.preventDefault();
            const it = filtered[Math.max(0, active)];
            if (it) pick(it.value);
        }
    };

    const list = (
        <div
            ref={popRef}
            style={style}
            className={cx(
                "rounded-xl border border-[#e7dbc9] bg-white shadow-lg",
                open ? "block" : "hidden"
            )}
            role="listbox"
            aria-activedescendant={active >= 0 && filtered[active] ? `ss-opt-${String(filtered[active].value)}` : undefined}
        >
            <div className="p-2">
                <input
                    autoFocus
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setActive(0); }}
                    placeholder={searchPlaceholder}
                    className="w-full rounded-lg border border-[#e7dbc9] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c9a44c]"
                />
            </div>

            <div className="py-1 overflow-auto" style={{ maxHeight: maxListHeight }}>
                {loading ? (
                    <div className="px-3 py-2 text-sm text-[#6b5545]">Loading…</div>
                ) : filtered.length ? (
                    filtered.map((it, i) => {
                        const id = `ss-opt-${String(it.value)}`;
                        const isSel = String(it.value) === String(value);
                        const isAct = i === active;
                        return (
                            <button
                                id={id}
                                key={String(it.value)}
                                type="button"
                                role="option"
                                aria-selected={isSel}
                                onMouseEnter={() => setActive(i)}
                                onClick={() => pick(it.value)}
                                className={cx(
                                    "block w-full text-left px-3 py-2 text-sm",
                                    isAct ? "bg-[#fff6e6]" : "",
                                    isSel ? "font-medium" : "text-[#3b2a1d]"
                                )}
                            >
                                {it.label}
                            </button>
                        );
                    })
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
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none" aria-hidden>
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
