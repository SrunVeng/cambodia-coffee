import { memo, useDeferredValue, useMemo, useState, useCallback } from "react"
import products from "../../data/products.json"
import ProductCard from "./ProductCard"
import ProductDetails from "./ProductDetails"

// Precompute a lowercase search index once per product
const ENRICHED_PRODUCTS = (products || []).map((p) => {
    const title = Object.values(p.title || {}).join(" ")
    const tags = Object.values(p.tags || {}).flat().join(" ")
    const code = p.code || ""
    return {
        ...p,
        __searchIndex: `${title} ${tags} ${code}`.toLowerCase(),
    }
})

function ProductGrid({ filter }) {
    const [selected, setSelected] = useState(null)

    // Defer filter so keystrokes remain responsive
    const deferredFilter = useDeferredValue(filter)

    const list = useMemo(() => {
        const { category, sort, search } = deferredFilter
        let out = ENRICHED_PRODUCTS

        // Category filter
        if (category && category !== "all") {
            out = out.filter((p) => p.category === category)
        }

        // Search (pre-indexed)
        const q = (search || "").trim().toLowerCase()
        if (q) {
            out = out.filter((p) => p.__searchIndex.includes(q))
        }

        // Sorting (never mutate original)
        if (sort === "price-asc") {
            out = [...out].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
        } else if (sort === "price-desc") {
            out = [...out].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
        } else if (sort === "newest") {
            out = [...out].sort((a, b) => {
                const ta = a.createdAt ? Date.parse(a.createdAt) : null
                const tb = b.createdAt ? Date.parse(b.createdAt) : null
                if (tb && ta) return tb - ta
                if (tb && !ta) return -1
                if (!tb && ta) return 1
                const ai = Number(a.id), bi = Number(b.id)
                if (!Number.isNaN(ai) && !Number.isNaN(bi)) return bi - ai
                return String(b.id).localeCompare(String(a.id))
            })
        } else {
            // "popular" default
            out = [...out].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        }

        return out
    }, [deferredFilter])

    const handleOpen = useCallback((p) => setSelected(p), [])
    const handleClose = useCallback(() => setSelected(null), [])

    return (
        <>
            {/* Tip: ensure animated wrappers use transform/opacity; avoid animating box-shadow */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {list.map((p) => (
                    <ProductCard
                        key={p.id}
                        p={p}
                        onClick={() => handleOpen(p)}
                    />
                ))}
            </div>

            {selected && (
                <ProductDetails product={selected} onClose={handleClose} />
            )}
        </>
    )
}

export default memo(ProductGrid)
