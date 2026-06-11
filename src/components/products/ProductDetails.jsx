import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { fmt } from "../../utils/currency"
import { motion as Motion } from "framer-motion"

export default function ProductDetails({ product, onClose }) {
    const { i18n, t } = useTranslation()

    const lang = i18n.language || "en"
    const title = product.title?.[lang] || product.title?.en || ""
    const desc = product.desc?.[lang] || product.desc?.en || ""
    const code = product.code || product.id

    const hasMany = Array.isArray(product.variants) && product.variants.length > 1

    const chosen = useMemo(
        () => hasMany ? null : product.variants?.[0],
        [hasMany, product.variants]
    )
    const price = product.price + (chosen?.delta || 0)

    return (
        <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center px-4" onClick={onClose}>
            <Motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="card w-full max-w-2xl overflow-hidden rounded-2xl shadow-xl bg-white"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="grid md:grid-cols-2">
                    {/* Image */}
                    <img src={product.images?.[0]} alt={title} className="w-full h-full object-cover" />

                    {/* Content */}
                    <div className="p-6 space-y-4 flex flex-col justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-[var(--brand-ink)]">{title}</h3>
                            <div className="text-xs opacity-60 mt-1">{t("products.code")}: {code}</div>
                            <p className="opacity-80 text-sm mt-2">{desc}</p>
                        </div>

                        {/* Bottom row: Price + Add button */}
                        <div className="flex items-center justify-between pt-4 border-t border-[var(--ring)]">
                            <div className="flex items-center gap-2 text-lg font-semibold text-[var(--brand-accent)]">
                                <span className="text-sm opacity-70">1 KG =</span>
                                <span>{fmt(price, product.currency)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Motion.div>
        </div>
    )
}
