import { useTranslation } from "react-i18next"
import products from "../../data/products.json"
import ProductCard from "./ProductCard"
import ProductDetails from "./ProductDetails"
import { useState } from "react"

export default function ProductGrid({ filter }) {
    const { i18n } = useTranslation()
    const [selected, setSelected] = useState(null)

    let list = [...products]

    // Filter by category
    if (filter.category !== "all") {
        list = list.filter((p) => p.category === filter.category)
    }

    // 🔍 Search across all translations + code
    if (filter.search?.trim()) {
        const q = filter.search.toLowerCase()

        list = list.filter((p) => {
            // title (all langs)
            const titleMatch = Object.values(p.title || {})
                .join(" ")
                .toLowerCase()
                .includes(q)

            // tags (all langs)
            const tagsMatch = Object.values(p.tags || {})
                .flat()
                .join(" ")
                .toLowerCase()
                .includes(q)

            // code
            const codeMatch = (p.code || "").toLowerCase().includes(q)

            return titleMatch || tagsMatch || codeMatch
        })
    }

    // Sorting
    if (filter.sort === "price-asc") {
        list.sort((a, b) => a.price - b.price)
    } else if (filter.sort === "price-desc") {
        list.sort((a, b) => b.price - a.price)
    } else if (filter.sort === "newest") {
        list.sort((a, b) => (a.id > b.id ? -1 : 1)) // simple newest
    } else if (filter.sort === "popular") {
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }

    return (
        <>
            {/* 📱 Default: 2 cols on mobile, then scale up */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {list.map((p) => (
                    <ProductCard key={p.id} p={p} onClick={() => setSelected(p)} />
                ))}
            </div>

            {selected && (
                <ProductDetails product={selected} onClose={() => setSelected(null)} />
            )}
        </>
    )
}
