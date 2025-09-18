import { useState, useMemo } from "react"
import { ShoppingCart, PackageX, Tag } from "lucide-react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { fmt } from "../utils/currency.js"
import { tField } from "../utils/i18n-helpers"
import RatingStars from "../components/RatingStars"
import { useToast } from "./ui/ToastHub.jsx" // ← adjust path if needed

function VariantSelector({ variants = [], value, onChange, basePrice = 0, currency, t }) {
    if (!variants.length) return null
    return (
        <div className="mt-2">
            <div className="text-xs uppercase tracking-wide text-[#857567]">
                {t("products.size", { defaultValue: "Size" })}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
                {variants.map((v) => {
                    const disabled = typeof v.stock === "number" && v.stock <= 0
                    const selected = v.id === value
                    const delta = Number(v?.delta) || 0
                    const deltaLabel = delta === 0 ? "" : ` ${delta > 0 ? "+" : "−"}${fmt(Math.abs(delta), currency)}`
                    return (
                        <button
                            key={v.id}
                            type="button"
                            disabled={disabled}
                            aria-pressed={selected}
                            onClick={() => onChange(v.id)}
                            className={[
                                "inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm border transition",
                                disabled
                                    ? "opacity-50 cursor-not-allowed border-[#e7dbc9] bg-white/50 text-[#a3907f]"
                                    : selected
                                        ? "border-[#2d1a14] bg-[#2d1a14] text-white shadow-sm"
                                        : "border-[#e7dbc9] bg-white/70 text-[#2d1a14] hover:bg-white",
                            ].join(" ")}
                            title={disabled ? t("products.soldOut", { defaultValue: "Sold out" }) : v.label}
                        >
                            <span className="whitespace-nowrap">{v.label}</span>
                            {delta !== 0 && <span className="text-[11px] opacity-90">{deltaLabel}</span>}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default function ProductCard({
                                        p,
                                        lang,
                                        currency,
                                        onAdd,
                                        /** Optional: preselect a variant (useful when editing an existing cart line) */
                                        initialVariantId,
                                        /** Optional: override action label, e.g., "Update" when editing */
                                        ctaLabel,
                                    }) {
    const { t } = useTranslation()
    const toast = useToast()

    const localizedTitle = tField(p.title, lang)
    const variants = Array.isArray(p.variants) ? p.variants : []
    const initialId = initialVariantId ?? variants?.[0]?.id ?? "base"
    const [variantId, setVariantId] = useState(initialId)

    const currentVariant = useMemo(() => {
        if (!variants.length)
            return { id: "base", delta: 0, label: t("products.base", { defaultValue: "Base" }) }
        return variants.find((v) => v.id === variantId) ?? variants[0]
    }, [variants, variantId, t])

    const basePrice = Number(p.price) || 0
    const unit = basePrice + (Number(currentVariant?.delta) || 0)
    const cardCurrency = p.currency || currency

    const variantStock = typeof currentVariant?.stock === "number" ? currentVariant.stock : undefined
    const productStock = typeof p?.stock === "number" ? p.stock : undefined
    const isSoldOut =
        variantStock !== undefined ? variantStock <= 0 : productStock !== undefined ? productStock <= 0 : false

    const onAddClick = () => {
        if (isSoldOut) {
            toast(t("products.soldOut", { defaultValue: "Sold out" }))
            return
        }
        const payload = {
            id: p.id,
            code: p.code,
            title: localizedTitle,
            price: unit,
            variantId: currentVariant.id,
            variantLabel: currentVariant.label,
            qty: 1,
            currency: cardCurrency,
            image: p.images?.[0],
        }
        onAdd?.(payload)
        const addedTxt = ctaLabel || t("common.added", { defaultValue: "Added to cart" })
        const sizeTxt = currentVariant?.label ? ` • ${currentVariant.label}` : ""
        toast(`${localizedTitle}${sizeTxt} — ${addedTxt}`)
    }

    return (
        <motion.div className="rounded-2xl border border-[#e7dbc9] bg-[#fffaf3] p-3 sm:p-4" whileHover={{ scale: 1.01 }}>
            <div className="flex gap-3">
                {/* Image */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                    <img
                        src={p.images?.[0]}
                        alt={localizedTitle}
                        className="w-full h-full object-cover rounded-xl border border-[#e7dbc9] bg-white"
                        loading="lazy"
                        decoding="async"
                    />
                    {isSoldOut && (
                        <div className="absolute inset-0 grid place-items-center rounded-xl bg-black/30 backdrop-blur-[1px]">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-[#2d1a14]">
                <PackageX className="w-3.5 h-3.5" />
                  {t("products.soldOut", { defaultValue: "Sold out" })}
              </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="font-semibold text-[#2d1a14] truncate">{localizedTitle}</div>
                            {p.code && <div className="text-xs text-[#857567] truncate">{p.code}</div>}
                        </div>
                        <RatingStars value={p.rating} />
                    </div>

                    {/* Tags */}
                    {Array.isArray(p.tags?.[lang]) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {p.tags[lang].slice(0, 3).map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#e7dbc9] bg-white/60 text-[11px] text-[#6b5545]"
                                >
                  <Tag className="w-3 h-3" />
                  <span className="truncate max-w-[9rem]">{tag}</span>
                </span>
                            ))}
                        </div>
                    )}

                    {/* Variant pills */}
                    <VariantSelector
                        variants={variants}
                        value={variantId}
                        onChange={setVariantId}
                        basePrice={basePrice}
                        currency={cardCurrency}
                        t={t}
                    />

                    {/* Price + CTA */}
                    <div className="mt-3 flex items-center justify-between">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-[#857567]">
                                {t("products.price", { defaultValue: "Price" })}
                            </div>
                            <div className="font-semibold text-lg text-[#2d1a14]">{fmt(unit, cardCurrency)}</div>
                        </div>

                        <motion.button
                            type="button"
                            disabled={isSoldOut}
                            onClick={onAddClick}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            className={[
                                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none",
                                isSoldOut
                                    ? "bg-[#e8dfd0] text-[#9b8b7c] cursor-not-allowed"
                                    : "bg-gradient-to-br from-[#4b2e24] to-[#2d1a14] text-white shadow-md focus-visible:ring-2 focus-visible:ring-[#c9a44c]",
                            ].join(" ")}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            {ctaLabel || t("common.addToCart", { defaultValue: "Add to cart" })}
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
