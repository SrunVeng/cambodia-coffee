import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import rawProducts from "../data/products.json"

import SearchBar from "./SearchBar"
import FilterPill from "./FilterPill"
import CategoryPopover from "./CategoryPopover"
import ProductCard from "./ProductCard"
import { normalizeLang, tField } from "../utils/i18n-helpers.js"

function toProductsArray(src) {
    if (!src) return []
    const unwrapped = src.default ?? src
    if (Array.isArray(unwrapped)) return unwrapped
    if (Array.isArray(unwrapped?.products)) return unwrapped.products
    return []
}

/**
 * Props:
 * - open, onClose, onAdd, currency
 * - initialSelections?: { [productId]: variantId }  // preselect variant per product (useful when editing)
 * - editMode?: boolean                               // if true, CTA label becomes "Update"
 */
export default function ProductPicker({ open, onClose, onAdd, currency, initialSelections = {}, editMode = false }) {
    const { t, i18n } = useTranslation()
    const lang = normalizeLang(i18n.language)
    const [q, setQ] = useState("")
    const [cat, setCat] = useState("all")
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [toast, setToast] = useState(false)

    const products = useMemo(() => toProductsArray(rawProducts), [])
    const categories = useMemo(() => {
        const set = new Set(products.map((p) => p.category).filter(Boolean))
        return ["all", ...Array.from(set)]
    }, [products])

    const activeFilterCount = cat === "all" ? 0 : 1

    const list = useMemo(() => {
        const needle = q.trim().toLowerCase()
        return products
            .filter((p) => (cat === "all" ? true : p.category === cat))
            .filter((p) => {
                if (!needle) return true
                const title = tField(p.title, lang).toLowerCase()
                const code = (p.code || "").toLowerCase()
                return title.includes(needle) || code.includes(needle)
            })
    }, [q, cat, lang, products])

    if (!open) return null

    const handleAdd = (item) => {
        onAdd(item)
        setToast(true)
        setTimeout(() => setToast(false), 2000)
    }

    return (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" onClick={onClose}>
            {/* Backdrop */}
            <motion.div
                className="absolute inset-0 bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            />

            {/* Slide-over */}
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                className="absolute right-0 top-0 h-full w-full sm:w-[640px] bg-white shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b flex items-center gap-3 shrink-0">
                    <SearchBar
                        value={q}
                        onChange={setQ}
                        placeholder={t("products.search", { defaultValue: "Search products..." })}
                    />

                    <div className="relative">
                        <FilterPill
                            activeCount={activeFilterCount}
                            onClick={() => setFiltersOpen((s) => !s)}
                            label={t("products.filter", { defaultValue: "Filter" })}
                        />
                        <AnimatePresence>
                            {filtersOpen && (
                                <CategoryPopover
                                    open={filtersOpen}
                                    categories={categories}
                                    value={cat}
                                    onChange={setCat}
                                    onClose={() => setFiltersOpen(false)}
                                    translateCat={(k) => (k === "all" ? t("products.all", { defaultValue: "All" }) : k)}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    <button type="button" className="btn btn-ghost ml-auto" onClick={onClose}>
                        {t("common.close", { defaultValue: "Close" })}
                    </button>
                </div>

                {/* List */}
                <div className="p-4 grid gap-3 sm:grid-cols-1 overflow-y-auto flex-1">
                    {list.map((p) => (
                        <ProductCard
                            key={p.id}
                            p={p}
                            lang={lang}
                            currency={currency}
                            onAdd={handleAdd}
                            initialVariantId={initialSelections?.[p.id]}
                            ctaLabel={editMode ? t("common.update", { defaultValue: "Update" }) : undefined}
                        />
                    ))}

                    {list.length === 0 && (
                        <div className="text-sm text-gray-500 p-6 text-center">
                            {t("products.empty", { defaultValue: "No products found." })}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
