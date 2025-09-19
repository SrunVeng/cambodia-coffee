import { useState, useTransition, useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import cats from "../../data/product-categories.json"

export default function ProductFilterSort({ onChange }) {
    const { t, i18n } = useTranslation()
    const [cat, setCat] = useState("all")
    const [sort, setSort] = useState("popular")
    const [search, setSearch] = useState("")
    const [, startTransition] = useTransition()

    const emit = useCallback(
        (c = cat, s = sort, q = search) => {
            startTransition(() => onChange?.({ category: c, sort: s, search: q }))
        },
        [onChange, cat, sort, search]
    )

    // Debounce search for smoother typing + fewer re-renders
    useEffect(() => {
        const id = setTimeout(() => emit(cat, sort, search.trim()), 220)
        return () => clearTimeout(id)
    }, [search, cat, sort, emit])

    return (
        <div className="bg-white/90 backdrop-blur-sm border border-[var(--ring)] rounded-2xl shadow-sm p-4 flex flex-col md:flex-row items-stretch md:items-center gap-4">
            {/* Search */}
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("products.searchPlaceholder")}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--ring)] text-sm focus:ring-2 focus:ring-[var(--brand-accent)] outline-none"
                />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium opacity-70">
                    {t("products.filter")}
                </label>
                <select
                    className="px-3 py-2 rounded-lg border border-[var(--ring)] text-sm bg-white focus:ring-2 focus:ring-[var(--brand-accent)] outline-none"
                    value={cat}
                    onChange={(e) => {
                        const next = e.target.value
                        setCat(next)
                        emit(next, sort, search)
                    }}
                >
                    <option value="all">{t("products.all")}</option>
                    {cats.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name?.[i18n.language] || c.name?.en}
                        </option>
                    ))}
                </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium opacity-70">
                    {t("products.sort")}
                </label>
                <select
                    className="px-3 py-2 rounded-lg border border-[var(--ring)] text-sm bg-white focus:ring-2 focus:ring-[var(--brand-accent)] outline-none"
                    value={sort}
                    onChange={(e) => {
                        const next = e.target.value
                        setSort(next)
                        emit(cat, next, search)
                    }}
                >
                    <option value="popular">{t("products.sortPopular")}</option>
                    <option value="price-asc">{t("products.sortPriceAsc")}</option>
                    <option value="price-desc">{t("products.sortPriceDesc")}</option>
                    <option value="newest">{t("products.sortNewest")}</option>
                </select>
            </div>
        </div>
    )
}
