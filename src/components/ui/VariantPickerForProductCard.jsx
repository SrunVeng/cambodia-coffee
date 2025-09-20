import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useCart } from "../../store/cart"
import { useToast } from "./ToastHub.jsx"
import { fmt } from "../../utils/currency"

/**
 * Variant-first Add to Cart trigger.
 * - Button click opens a fixed-position panel under the button.
 * - Selecting a variant adds to cart and closes.
 * - Panel clamps to viewport; no clipping; no horizontal scroll.
 */
export default function VariantPickerForProductCard({
                                                        product,
                                                        className = "",
                                                        size = "md",          // "sm" | "md" | "lg"
                                                        onAdded,              // (variantId) => void
                                                        requireChoice = true, // force opening the picker before add
                                                    }) {
    const { i18n, t } = useTranslation()
    const add = useCart((s) => s.add)
    const toast = useToast()

    const lang = i18n.language || "en"
    const title = product.title?.[lang] || product.title?.en || ""
    const code = product.code || product.id
    const variants = Array.isArray(product.variants) ? product.variants : []
    const hasMany = variants.length > 1

    const btnRef = useRef(null)
    const [open, setOpen] = useState(false)
    const [panelStyle, setPanelStyle] = useState({ top: 0, left: 0, width: 320, maxHeight: 320 })

    const sizeCls = {
        sm: "h-auto min-h-[42px] px-3 text-xs rounded-lg truncate",
        md: "h-auto min-h-[44px] px-4 text-sm rounded-xl truncate",
        lg: "h-auto min-h-[48px] px-5 text-base rounded-2xl truncate",
    }[size]

    const prices = useMemo(() => {
        const map = {}
        for (const v of variants) map[v.id] = (product.price || 0) + (v.delta || 0)
        map.base = product.price || 0
        return map
    }, [product.price, variants])

    // Compute fixed panel position & size (clamped to viewport)
    const measure = () => {
        const el = btnRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const gap = 8
        const minW = Math.max(288, r.width)
        const maxW = Math.min(440, Math.floor(window.innerWidth * 0.9))
        const panelW = Math.min(Math.max(minW, r.width), maxW)

        // right-align to button, but clamp to viewport
        const left = Math.min(Math.max(8, r.right - panelW), window.innerWidth - panelW - 8)
        const top = Math.min(r.bottom + gap, window.innerHeight - 16)
        const maxHeight = Math.max(240, Math.min(440, window.innerHeight - top - 16))
        setPanelStyle({ top, left, width: panelW, maxHeight })
    }

    useLayoutEffect(() => {
        if (!open) return
        measure()
        const onScroll = () => measure()
        const onResize = () => measure()
        window.addEventListener("scroll", onScroll, true)
        window.addEventListener("resize", onResize)
        window.addEventListener("orientationchange", onResize)
        return () => {
            window.removeEventListener("scroll", onScroll, true)
            window.removeEventListener("resize", onResize)
            window.removeEventListener("orientationchange", onResize)
        }
    }, [open])

    // ESC to close
    useEffect(() => {
        const onEsc = (e) => e.key === "Escape" && setOpen(false)
        document.addEventListener("keydown", onEsc)
        return () => document.removeEventListener("keydown", onEsc)
    }, [])

    const addWithVariant = (variantId) => {
        add({
            id: product.id,
            code,                 // still included in cart payload
            title,
            price: product.price, // base price; deltas handled downstream/display
            variantId: variantId || "base",
            qty: 1,
        })
        toast(`${title} — ${t("common.added")}`)
        onAdded?.(variantId || "base")
        setOpen(false)
    }

    const onPrimaryClick = () => {
        if (requireChoice || hasMany) {
            setOpen(true)
            requestAnimationFrame(measure)
        } else {
            const only = variants?.[0]?.id || "base"
            addWithVariant(only)
        }
    }

    return (
        <div className={`relative ${className}`}>
            {/* Trigger */}
            <motion.button
                ref={btnRef}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.03 }}
                onClick={onPrimaryClick}
                className={`btn btn-primary w-full justify-center ${sizeCls}`}
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                {t("products.addToCart")}
            </motion.button>

            {/* Portal panel */}
            {typeof window !== "undefined" && typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {open && (
                            <>
                                {/* overlay for outside-click close */}
                                <motion.div
                                    className="fixed inset-0 z-[69]"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setOpen(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                    transition={{ duration: 0.16, ease: "easeOut" }}
                                    role="dialog"
                                    aria-label={t("products.chooseSize")}
                                    className="fixed z-[70]"
                                    style={{ top: panelStyle.top, left: panelStyle.left, width: panelStyle.width }}
                                >
                                    <div className="rounded-2xl border border-black/10 bg-white shadow-xl overflow-hidden">
                                        <header className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-semibold">{t("products.chooseSize")}</div>
                                                <div className="text-xs opacity-60 line-clamp-1">{title}</div>
                                            </div>
                                            <button
                                                className="p-1.5 rounded-lg hover:bg-black/5"
                                                aria-label={t("common.close")}
                                                onClick={() => setOpen(false)}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </header>

                                        {/* Variant list (no code line; hover + border effect) */}
                                        <ul className="py-2 overflow-y-auto overflow-x-hidden" style={{ maxHeight: panelStyle.maxHeight }}>
                                            {variants.map((v) => (
                                                <li key={v.id} className="px-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => addWithVariant(v.id)}
                                                        className="
                              w-full flex items-center justify-between gap-3
                              rounded-xl border border-black/10 bg-white
                              px-4 py-3 my-1
                              text-left transition
                              hover:bg-black/5 hover:border-black/20
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20
                              active:scale-[0.99]
                              shadow-sm hover:shadow
                            "
                                                    >
                            <span className="min-w-0">
                              <span className="block text-sm font-medium truncate">{v.label}</span>
                            </span>
                                                        <span className="text-sm font-semibold whitespace-nowrap tabular-nums">
                              {fmt(prices[v.id], product.currency)}
                            </span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>

                                        <footer className="px-4 py-2 border-t border-black/5 text-xs opacity-70">
                                            {t("common.tapToSelect")}
                                        </footer>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    )
}
