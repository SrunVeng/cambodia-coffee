import { useTranslation } from "react-i18next"
import { useCart } from "../../store/cart"
import { fmt } from "../../utils/currency"
import { motion } from "framer-motion"

export default function ProductCard({ p, onClick }) {
    const { i18n, t } = useTranslation()
    const add = useCart((s) => s.add)

    const lang = i18n.language || "en"
    const title = p.title?.[lang] || p.title?.en || ""
    const tags = Array.isArray(p.tags?.[lang]) ? p.tags[lang] : []
    const code = p.code || p.id

    const firstVariant = p.variants?.[0]
    const basePrice = p.price + (firstVariant?.delta || 0)

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="card flex flex-col bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden"
        >
            {/* Image */}
            <button onClick={onClick} className="relative block overflow-hidden">
                <img
                    src={p.images?.[0]}
                    alt={title}
                    className="w-full aspect-[4/3] object-cover transform hover:scale-105 transition duration-500"
                />
                {/* Price Badge */}
                <div className="absolute top-3 right-3 bg-[var(--brand-accent)] text-white text-xs px-3 py-1 rounded-full shadow-md">
                    {fmt(basePrice, p.currency)}
                </div>
            </button>

            {/* Content */}
            <div className="flex flex-col flex-1 justify-between p-4 space-y-3">
                <div>
                    <div className="font-semibold text-lg text-[var(--brand-ink)]">
                        {title}
                    </div>
                    <div className="text-xs opacity-60">
                        {t("products.code")}: {code}
                    </div>
                    {tags.length > 0 && (
                        <div className="text-sm opacity-70 mt-1">
                            {tags.join(" • ")}
                        </div>
                    )}
                    {p.rating && (
                        <div className="text-yellow-500 text-sm mt-1">
                            {"★".repeat(Math.round(p.rating))}{" "}
                            <span className="opacity-70">{p.rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                {/* Buttons fixed at bottom */}
                <div className="flex gap-2 mt-auto">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                        className="flex-1 btn btn-ghost text-sm"
                        onClick={onClick}
                    >
                        {t("products.details")}
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                        className="flex-1 btn btn-primary text-sm"
                        onClick={() =>
                            add({
                                id: p.id,
                                code,
                                title,
                                price: p.price,
                                variantId: firstVariant?.id || "base",
                                qty: 1,
                            })
                        }
                    >
                        {t("products.addToCart")}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    )
}
