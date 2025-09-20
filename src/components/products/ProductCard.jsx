import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { fmt } from "../../utils/currency"
import VariantPickerForProductCard from "../ui/VariantPickerForProductCard.jsx"

/**
 * Product card with mobile-friendly actions:
 * - Buttons stack on mobile, inline from sm: up.
 * - Card doesn't clip the variant panel.
 */
export default function ProductCard({ p, onClick }) {
    const { i18n, t } = useTranslation()

    const lang = i18n.language || "en"
    const title = p.title?.[lang] || p.title?.en || ""
    const tags = Array.isArray(p.tags?.[lang]) ? p.tags[lang] : []
    const code = p.code || p.id

    const firstVariant = p.variants?.[0]
    const basePrice = (p.price || 0) + (firstVariant?.delta || 0)
    const img = p.images?.[0]
    const currency = p.currency

    return (
        <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20% 0px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="group relative flex flex-col rounded-2xl bg-white shadow-md ring-1 ring-black/5 hover:shadow-lg transition"
            // NOTE: no overflow-hidden here; only on the image to avoid popover clipping.
        >
            {/* Image */}
            <button
                onClick={onClick}
                className="relative block rounded-t-2xl overflow-hidden"
                aria-label={title}
            >
                <img
                    src={img || "/img/placeholder-product.jpg"}
                    alt={title}
                    loading="lazy"
                    className="w-full aspect-[4/3] object-cover transform group-hover:scale-[1.03] transition duration-500"
                    onError={(e) => { e.currentTarget.src = "/img/placeholder-product.jpg" }}
                />
                <div className="absolute top-3 right-3 rounded-full bg-[var(--brand-accent)] text-white text-xs px-3 py-1 shadow-md">
                    {fmt(basePrice, currency)}
                </div>
            </button>

            {/* Content */}
            <div className="flex flex-col gap-3 p-4">
                <div>
                    <h3 className="font-semibold text-lg text-[var(--brand-ink)] line-clamp-2">{title}</h3>

                    <div className="mt-0.5 text-xs text-black/60">
                        {t("products.code")}: {code}
                    </div>

                    {tags.length > 0 && (
                        <div className="mt-1 text-sm text-black/70 line-clamp-2">
                            {tags.join(" • ")}
                        </div>
                    )}

                    {!!p.rating && (
                        <div className="mt-1 text-sm text-yellow-500">
                            {"★".repeat(Math.round(p.rating))}
                            <span className="text-black/50 ml-1">{Number(p.rating).toFixed(1)}</span>
                        </div>
                    )}
                </div>

                {/* Actions — stack on mobile, inline from sm: */}
                <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        whileHover={{ scale: 1.03 }}
                        className="btn btn-ghost w-full h-auto min-h-[44px] py-3 rounded-xl truncate"
                        onClick={onClick}
                        title={t("products.details")}
                    >
                        {t("products.details")}
                    </motion.button>

                    {/* Add → choose variant → add */}
                    <VariantPickerForProductCard
                        product={p}
                        size="md"
                        className="w-full"
                        requireChoice
                    />
                </div>
            </div>
        </motion.div>
    )
}
