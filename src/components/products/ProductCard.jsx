import { memo } from "react"
import { useTranslation } from "react-i18next"
import { fmt } from "../../utils/currency"

const PLACEHOLDER_IMAGE = "/img/placeholder-product.jpg"

/**
 * Product card with mobile-friendly actions:
 * - Buttons stack on mobile, inline from sm: up.
 * - Card doesn't clip the variant panel.
 */
function ProductCard({ p, onClick }) {
    const { i18n, t } = useTranslation()

    const lang = i18n.language || "en"
    const title = p.title?.[lang] || p.title?.en || ""
    const tags = Array.isArray(p.tags?.[lang]) ? p.tags[lang] : []
    const code = p.code || p.id

    const firstVariant = p.variants?.[0]
    const basePrice = (p.price || 0) + (firstVariant?.delta || 0)
    const img = p.images?.[0] || PLACEHOLDER_IMAGE
    const currency = p.currency
    const openDetails = () => onClick?.(p.id)

    return (
        <article
            className="group relative flex flex-col rounded-2xl bg-white shadow-md ring-1 ring-black/5 hover:shadow-lg transition"
        >
            {/* Image */}
            <button
                onClick={openDetails}
                className="relative block rounded-t-2xl overflow-hidden"
                aria-label={title}
            >
                <img
                    src={img}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-[4/3] object-cover transform group-hover:scale-[1.03] transition duration-500"
                    onError={(e) => {
                        if (e.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) return
                        e.currentTarget.src = PLACEHOLDER_IMAGE
                    }}
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
                    <button
                        type="button"
                        className="btn btn-ghost w-full h-auto min-h-[44px] py-3 rounded-xl truncate transform-gpu hover:scale-[1.03] active:scale-[0.96]"
                        onClick={openDetails}
                        title={t("products.details")}
                    >
                        {t("products.details")}
                    </button>
                </div>
            </div>
        </article>
    )
}

export default memo(ProductCard)
