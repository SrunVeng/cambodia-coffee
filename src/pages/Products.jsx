import { useState } from "react"
import ProductFilterSort from "../components/products/ProductFilterSort"
import ProductGrid from "../components/products/ProductGrid"
import { useTranslation } from "react-i18next"

export default function Products() {
    const { t } = useTranslation()
    const [filter, setFilter] = useState({ category: "all", sort: "popular" })

    return (
        <section className="bg-[var(--brand-bg)] min-h-screen py-16">
            <div className="container-narrow space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--brand-ink)]">
                    {t("products.title")}
                </h2>
                <ProductFilterSort onChange={setFilter} />
                <ProductGrid filter={filter} />
            </div>
        </section>
    )
}
