import { useState, useTransition, useCallback, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import Dropdown from "../ui/Dropdown.jsx"
import cats from "../../data/product-categories.json"

export default function ProductFilterSort({ onChange }) {
    const { t, i18n } = useTranslation()
    const [cat, setCat] = useState("all")
    const [sort, setSort] = useState("popular")
    const [search, setSearch] = useState("")
    const [, startTransition] = useTransition()

    const emit = useCallback(
        (c = cat, s = sort, q = search) => startTransition(() => onChange?.({ category: c, sort: s, search: q })),
        [onChange, cat, sort, search]
    )

    useEffect(() => {
        const id = setTimeout(() => emit(cat, sort, search.trim()), 220)
        return () => clearTimeout(id)
    }, [search, cat, sort, emit])

    const catItems = useMemo(() => ([
        { id: "all", label: t("products.all") },
        ...cats.map((c) => ({ id: c.id, label: c.name?.[i18n.language] || c.name?.en || c.id })),
    ]), [i18n.language, t])

    const sortItems = useMemo(() => ([
        { id: "popular",    label: t("products.sortPopular") },
        { id: "price-asc",  label: t("products.sortPriceAsc") },
        { id: "price-desc", label: t("products.sortPriceDesc") },
        { id: "newest",     label: t("products.sortNewest") },
    ]), [t])

    return (
        <div className="bg-white/90 backdrop-blur-sm border border-[var(--ring)] rounded-2xl shadow-sm p-4 flex flex-col md:flex-row items-stretch md:items-center gap-4">
            {/* Search */}
            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("products.searchPlaceholder")}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--ring)] text-sm focus:ring-2 focus:ring-[var(--brand-accent)] outline-none"
                />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium opacity-70">{t("products.filter")}</span>
                <Dropdown
                    items={catItems}
                    value={cat}
                    onChange={(next) => { setCat(next); emit(next, sort, search) }}
                    placeholder={t("products.all")}
                    size="sm"
                    className="min-w-[250px]"
                    align="start"
                />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium opacity-70">{t("products.sort")}</span>
                <Dropdown
                    items={sortItems}
                    value={sort}
                    onChange={(next) => { setSort(next); emit(cat, next, search) }}
                    placeholder={t("products.sortPopular")}
                    size="sm"
                    className="min-w-[150px]"
                    align="end"
                />
            </div>
        </div>
    )
}
