import { useCallback, useState, useTransition } from "react"
import ProductFilterSort from "../components/products/ProductFilterSort"
import ProductGrid from "../components/products/ProductGrid"
import { useTranslation } from "react-i18next"

export default function Products() {
    const { t } = useTranslation()
    const [filter, setFilter] = useState({ category: "all", sort: "popular", search: "" })
    const [, startTransition] = useTransition()
    const handleFilterChange = useCallback((next) => {
        startTransition(() => setFilter(next))
    }, [])

    return (
        <section className="bg-[var(--brand-bg)] min-h-screen py-20">
            <div className="container-narrow space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--brand-ink)]">
                    {t("products.title")}
                </h2>

                <ProductFilterSort onChange={handleFilterChange} />

                {/* Optional: show a subtle pending state */}
                {/* {isPending && <div className="text-sm opacity-70">Updating…</div>} */}

                <ProductGrid filter={filter} />
            </div>
        </section>
    )
}
