// components/ui/SearchableSelect.jsx
import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useLayoutEffect,
    useId,
} from "react";
import { createPortal } from "react-dom";

function cx(...c) { return c.filter(Boolean).join(" "); }

// Detect if any ancestor creates a containing block for fixed elements
function hasTransformedAncestor(node) {
    let el = node?.parentElement;
    while (el && el !== document.body) {
        const cs = getComputedStyle(el);
        if (
            cs.transform !== "none" ||
            cs.perspective !== "none" ||
            cs.filter !== "none" ||
            (cs.backdropFilter && cs.backdropFilter !== "none") ||
            (cs.contain && cs.contain.includes("paint"))
        ) return true;
        el = el.parentElement;
    }
    return false;
}

/**
 * SearchableSelect
 * - Auto fallback to inline absolute positioning if a transformed ancestor exists
 * - Portal + fixed when safe (no transformed ancestor)
 * - Measured top anchoring (no blur, stays attached on resize)
 * - Debounced repositioning on resize/scroll/observer
 * - Keyboard nav + Backspace/Delete clear (when closed)
 * - i18n-friendly via props: searchPlaceholder, noResultsText, loadingText, clearText, clearHint
 */
export default function SearchableSelect({
                                             items = [],               // [{ value, label }]
                                             value = "",
                                             onChange,
                                             placeholder = "Select…",
                                             disabled = false,
                                             clearable = false,
                                             loading = false,
                                             size = "md",               // sm | md | lg
                                             className = "",
                                             // Overlay / portal behavior
                                             portalToBody = true,
                                             menuZIndex = 4000,
                                             closeSignal = false,       // external “please close”
                                             searchPlaceholder = "Search…",
                                             maxMenuHeight = 340,
                                             noResultsText = "No results",
                                             loadingText = "Loading…",
                                             clearText = "Clear selection",
                                             clearHint = "(Del)",
                                         }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [active, setActive] = useState(-1);
    const [openUp, setOpenUp] = useState(false);
    const [maxListHeight, setMaxListHeight] = useState(260);
    const [forceInline, setForceInline] = useState(false); // when transformed ancestor exists

    const btnRef = useRef(null);
    const popRef = useRef(null);
    const inputRef = useRef(null);

    const listboxId = useId();
    const buttonId = useId();

    const tokens =
        ({ sm: { padd: "px-2 py-1.5", text: "text-sm" },
            md: { padd: "px-3 py-2",   text: "text-base" },
            lg: { padd: "px-4 py-2.5", text: "text-lg"  } }[size]) ||
        { padd: "px-3 py-2", text: "text-base" };

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

    // Decide portal mode each time the menu opens (DOM must exist)
    useLayoutEffect(() => {
        if (!open) return;
        setForceInline(hasTransformedAncestor(btnRef.current));
    }, [open]);

    const usePortal = portalToBody && !forceInline;

    // ----- positioning (fixed to viewport or absolute to wrapper) -----
    const [style, setStyle] = useState({});
    const reposition = () => {
        const btn = btnRef.current;
        const pop = popRef.current;
        if (!btn) return;

        const r = btn.getBoundingClientRect();
        const vw = window.innerWidth || document.documentElement.clientWidth;
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const gap = 6;

        const below = vh - r.bottom;
        const above = r.top;
        const wantOpenUp = below < 220 && above > below;
        setOpenUp(wantOpenUp);

        const maxH = Math.max(
            160,
            Math.min(wantOpenUp ? r.top - 8 : vh - r.bottom - 8, maxMenuHeight)
        );
        setMaxListHeight(maxH);

        if (usePortal) {
            // fixed to viewport
            const desiredWidth = r.width;
            const width = Math.min(desiredWidth, vw - 16);
            const left = Math.min(Math.max(8, r.left), vw - width - 8);

            let top;
            if (wantOpenUp) {
                const menuH = pop?.offsetHeight || maxMenuHeight;
                top = Math.max(8, r.top - gap - menuH);
            } else {
                top = Math.min(vh - 8, r.bottom + gap);
            }

            setStyle({
                position: "fixed",
                left: `${left}px`,
                width: `${width}px`,
                top: `${top}px`,
                zIndex: menuZIndex,
            });
        } else {
            // absolute to our own wrapper (.relative)
            const menuH = pop?.offsetHeight || maxMenuHeight;
            const btnH = btn.offsetHeight || 0;
            const top = wantOpenUp ? -(gap + menuH) : (btnH + gap);
            setStyle({
                position: "absolute",
                left: 0,
                width: "100%",
                top: `${top}px`,
                zIndex: menuZIndex,
            });
        }
    };

    // Debounced scheduler for reposition()
    const rafRef = useRef(0);
    const toRef  = useRef(0);
    const scheduleReposition = () => {
        if (!open) return;
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = 0;
            if (toRef.current) clearTimeout(toRef.current);
            toRef.current = setTimeout(() => { reposition(); }, 12); // ~1 frame + 12ms
        });
    };

    useLayoutEffect(() => {
        if (!open) return;

        reposition(); // initial pass

        const onScroll   = () => scheduleReposition();
        const onResize   = () => scheduleReposition();
        const onTransEnd = () => scheduleReposition();

        window.addEventListener("scroll", onScroll, true);
        window.addEventListener("resize", onResize, true);
        window.addEventListener("orientationchange", onResize, true);
        window.addEventListener("transitionend", onTransEnd, true);

        let roBtn, roPop;
        if ("ResizeObserver" in window) {
            if (btnRef.current) {
                roBtn = new ResizeObserver(scheduleReposition);
                roBtn.observe(btnRef.current);
            }
            if (popRef.current) {
                roPop = new ResizeObserver(scheduleReposition);
                roPop.observe(popRef.current);
            }
        }

        const fontReady = document.fonts?.ready;
        if (fontReady?.then) fontReady.then(() => scheduleReposition()).catch(() => {});

        return () => {
            window.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", onResize, true);
            window.removeEventListener("orientationchange", onResize, true);
            window.removeEventListener("transitionend", onTransEnd, true);
            if (roBtn) roBtn.disconnect();
            if (roPop) roPop.disconnect();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (toRef.current) clearTimeout(toRef.current);
            rafRef.current = 0;
            toRef.current = 0;
        };
    }, [open, usePortal, menuZIndex, maxMenuHeight]);

    // Lock body scroll only when actually portaling to body
    useEffect(() => {
        if (!usePortal) return;
        if (open) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = prev; };
        }
    }, [open, usePortal]);

    // outside click & ESC
    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            const b = btnRef.current;
            const p = popRef.current;
            if (b?.contains(e.target) || p?.contains(e.target)) return;
            setOpen(false);
        };
        const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    // focus input when open
    useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 0); }, [open]);

    const pick = (val) => { onChange?.(val); setOpen(false); setQ(""); setActive(-1); };
    const moveActive = (nxt) => setActive(Math.max(0, Math.min(filtered.length - 1, nxt)));

    // keep active option visible
    useEffect(() => {
        if (!open) return;
        const p = popRef.current;
        const opt = p?.querySelector?.(`[data-ss-index="${active}"]`);
        opt?.scrollIntoView?.({ block: "nearest" });
    }, [active, open]);

    const onTriggerKeyDown = (e) => {
        // Quick clear via keyboard when menu is closed
        if (!open && clearable && value && (e.key === "Backspace" || e.key === "Delete")) {
            e.preventDefault(); pick(""); return;
        }
        if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault(); setOpen(true);
            const idx = Math.max(0, filtered.findIndex((i) => String(i.value) === String(value)));
            setActive(idx >= 0 ? idx : 0);
            return;
        }
        if (!open) return;

        switch (e.key) {
            case "Escape":    e.preventDefault(); setOpen(false); return;
            case "ArrowDown": e.preventDefault(); moveActive(active < 0 ? 0 : active + 1); return;
            case "ArrowUp":   e.preventDefault(); moveActive(active < 0 ? 0 : active - 1); return;
            case "Home":      e.preventDefault(); moveActive(0); return;
            case "End":       e.preventDefault(); moveActive(filtered.length - 1); return;
            case "PageDown":  e.preventDefault(); moveActive(active < 0 ? 0 : active + 10); return;
            case "PageUp":    e.preventDefault(); moveActive(active < 0 ? 0 : active - 10); return;
            case "Enter":     e.preventDefault(); { const it = filtered[Math.max(0, active)]; if (it) pick(it.value); } return;
            default: return;
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
            id={listboxId}
            aria-labelledby={buttonId}
        >
            <div className="p-2">
                <input
                    ref={inputRef}
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setActive(0); }}
                    placeholder={searchPlaceholder}
                    className="w-full rounded-lg border border-[#e7dbc9] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c9a44c]"
                />
            </div>

            {clearable && value && (
                <div className="px-2 pb-1" role="none">
                    <button
                        type="button"
                        onClick={() => pick("")}
                        className="w-full text-left rounded-lg px-3 py-2 text-xs text-[#6b5545] hover:bg-[#f4eadb] focus:outline-none focus:ring-2 focus:ring-[#c9a44c]"
                    >
                        {clearText} <span className="ml-1 opacity-70">{clearHint}</span>
                    </button>
                </div>
            )}

            <div
                className="py-1 overflow-auto"
                style={{ maxHeight: maxListHeight }}
                role="listbox"
                aria-activedescendant={
                    active >= 0 && filtered[active]
                        ? `ss-opt-${String(filtered[active].value)}`
                        : undefined
                }
            >
                {loading ? (
                    <div className="px-3 py-2 text-sm text-[#6b5545]">{loadingText}</div>
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
                                data-ss-index={i}
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
                    <div className="px-3 py-2 text-sm text-[#6b5545]">{noResultsText}</div>
                )}
            </div>
        </div>
    );

    return (
        <div className={cx("relative", className)}>
            <button
                type="button"
                id={buttonId}
                ref={btnRef}
                onClick={() => !disabled && setOpen((o) => !o)}
                onKeyDown={onTriggerKeyDown}
                disabled={disabled}
                className={cx(
                    "flex w-full items-center justify-between rounded-xl border border-[#e7dbc9] bg-[#fffaf3] text-[#3b2a1d] shadow-sm",
                    tokens.padd,
                    disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-white",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#c9a44c]"
                )}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-disabled={disabled}
            >
        <span className={cx("truncate", tokens.text)}>
          {selected?.label || placeholder}
        </span>
                <span className="ml-2 flex items-center">
          <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none" aria-hidden>
            <path d="M6 9l6 6 6-6" strokeWidth="1.5" />
          </svg>
        </span>
            </button>

            {usePortal && typeof document !== "undefined"
                ? createPortal(list, document.body)
                : list}
        </div>
    );
}
