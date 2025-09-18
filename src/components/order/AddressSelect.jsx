import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { translateName } from "../../utils/i18n-helpers"
import { X } from "lucide-react"

function MobilePicker({ open, onClose, items, value, onSelect, label }) {
    const { t } = useTranslation()
    const [query, setQuery] = useState("")
    const filtered = useMemo(
        () => items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase())),
        [items, query]
    )

    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#fffaf3]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e7dbc9] px-4 py-3">
                <h2 className="text-base font-medium text-[#3b2a1d]">{label}</h2>
                <button onClick={onClose}>
                    <X className="h-6 w-6 text-[#3b2a1d]" />
                </button>
            </div>

            {/* Search */}
            <div className="p-3">
                <input
                    type="text"
                    className="w-full rounded-lg border border-[#e7dbc9] bg-white px-3 py-2 text-sm text-[#3b2a1d] placeholder-[#9b8b7c] focus:border-[#c9a44c] focus:ring-2 focus:ring-[#c9a44c]"
                    placeholder={t("common.search", { defaultValue: "Search..." })}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filtered.map((item) => (
                    <button
                        key={item.code}
                        onClick={() => {
                            onSelect(item.code)
                            onClose()
                        }}
                        className={`w-full border-b border-[#f1e8da] px-4 py-3 text-left text-sm transition hover:bg-[#f9f5ef] ${
                            value === item.code ? "bg-[#f3ede2] font-medium" : ""
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
                {filtered.length === 0 && (
                    <div className="p-4 text-center text-sm text-[#857567]">
                        {t("common.no_results", { defaultValue: "No results found" })}
                    </div>
                )}
            </div>
        </div>
    )
}

function Dropdown({ label, items, value, onSelect, disabled }) {
    return (
        <select
            className="block w-full rounded-xl border border-[#e7dbc9] bg-[#fffaf3] px-3 py-2 text-sm text-[#3b2a1d] placeholder-[#9b8b7c] shadow-sm focus:border-[#c9a44c] focus:ring-2 focus:ring-[#c9a44c] disabled:bg-[#f2ede5] disabled:text-[#9b8b7c]"
            value={value || ""}
            onChange={(e) => onSelect(e.target.value)}
            disabled={disabled}
        >
            <option value="">{label}</option>
            {items.map((item) => (
                <option key={item.code} value={item.code}>
                    {item.label}
                </option>
            ))}
        </select>
    )
}

export default function AddressSelect({ value, onChange }) {
    const { i18n, t } = useTranslation()
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [communes, setCommunes] = useState([])
    const [villages, setVillages] = useState([])
    const [open, setOpen] = useState(null) // "province" | "district" | "commune" | "village"

    const v = value || {}
    const labelOf = (item) => translateName(item, i18n.language)

    // Load data once
    useEffect(() => {
        let abort = false
        ;(async () => {
            try {
                const [p, d, c, vv] = await Promise.all([
                    fetch("/address/provinces.json").then((r) => r.json()),
                    fetch("/address/districts.json").then((r) => r.json()),
                    fetch("/address/communes.json").then((r) => r.json()),
                    fetch("/address/villages.json").then((r) => r.json()),
                ])
                if (abort) return
                setProvinces((p.provinces || p).map((x) => ({ ...x, label: labelOf(x) })))
                setDistricts((d.districts || d).map((x) => ({ ...x, label: labelOf(x) })))
                setCommunes((c.communes || c).map((x) => ({ ...x, label: labelOf(x) })))
                setVillages((vv.villages || vv).map((x) => ({ ...x, label: labelOf(x) })))
            } catch (e) {
                console.error("Address load failed", e)
            }
        })()
        return () => {
            abort = true
        }
    }, [i18n.language])

    // Filtered options
    const dByProv = useMemo(() => districts.filter((d) => d.province_code === v.province), [districts, v.province])
    const cByDist = useMemo(() => communes.filter((c) => c.district_code === v.district), [communes, v.district])
    const vByComm = useMemo(() => villages.filter((x) => x.commune_code === v.commune), [villages, v.commune])

    const setLevel = (level, code) => {
        const next = { ...v }
        if (level === "province") {
            const item = provinces.find((p) => p.code === code)
            next.province = code || undefined
            next.provinceName = item?.label
            next.district = next.districtName = undefined
            next.commune = next.communeName = undefined
            next.village = next.villageName = undefined
        } else if (level === "district") {
            const item = dByProv.find((d) => d.code === code)
            next.district = code || undefined
            next.districtName = item?.label
            next.commune = next.communeName = undefined
            next.village = next.villageName = undefined
        } else if (level === "commune") {
            const item = cByDist.find((c) => c.code === code)
            next.commune = code || undefined
            next.communeName = item?.label
            next.village = next.villageName = undefined
        } else if (level === "village") {
            const item = vByComm.find((x) => x.code === code)
            next.village = code || undefined
            next.villageName = item?.label
        }
        onChange?.(next)
    }

    return (
        <div className="grid gap-3 md:grid-cols-4">
            {/* Province */}
            <div className="md:hidden">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setOpen("province")
                    }}
                    className="w-full rounded-xl border border-[#e7dbc9] bg-[#fffaf3] px-3 py-2 text-left text-sm text-[#3b2a1d]"
                >
                    {v.provinceName || t("order.province", { defaultValue: "Province" })}
                </button>
                <MobilePicker
                    open={open === "province"}
                    onClose={() => setOpen(null)}
                    items={provinces}
                    value={v.province}
                    onSelect={(code) => setLevel("province", code)}
                    label={t("order.province")}
                />
            </div>
            <div className="hidden md:block">
                <Dropdown
                    label={t("order.province")}
                    items={provinces}
                    value={v.province}
                    onSelect={(code) => setLevel("province", code)}
                />
            </div>

            {/* District */}
            <div className="md:hidden">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        v.province && setOpen("district")
                    }}
                    className="w-full rounded-xl border border-[#e7dbc9] bg-[#fffaf3] px-3 py-2 text-left text-sm text-[#3b2a1d] disabled:text-[#9b8b7c]"
                    disabled={!v.province}
                >
                    {v.districtName || t("order.district", { defaultValue: "District" })}
                </button>
                <MobilePicker
                    open={open === "district"}
                    onClose={() => setOpen(null)}
                    items={dByProv}
                    value={v.district}
                    onSelect={(code) => setLevel("district", code)}
                    label={t("order.district")}
                />
            </div>
            <div className="hidden md:block">
                <Dropdown
                    label={t("order.district")}
                    items={dByProv}
                    value={v.district}
                    onSelect={(code) => setLevel("district", code)}
                    disabled={!v.province}
                />
            </div>

            {/* Commune */}
            <div className="md:hidden">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        v.district && setOpen("commune")
                    }}
                    className="w-full rounded-xl border border-[#e7dbc9] bg-[#fffaf3] px-3 py-2 text-left text-sm text-[#3b2a1d] disabled:text-[#9b8b7c]"
                    disabled={!v.district}
                >
                    {v.communeName || t("order.commune", { defaultValue: "Commune" })}
                </button>
                <MobilePicker
                    open={open === "commune"}
                    onClose={() => setOpen(null)}
                    items={cByDist}
                    value={v.commune}
                    onSelect={(code) => setLevel("commune", code)}
                    label={t("order.commune")}
                />
            </div>
            <div className="hidden md:block">
                <Dropdown
                    label={t("order.commune")}
                    items={cByDist}
                    value={v.commune}
                    onSelect={(code) => setLevel("commune", code)}
                    disabled={!v.district}
                />
            </div>

            {/* Village */}
            <div className="md:hidden">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        v.commune && setOpen("village")
                    }}
                    className="w-full rounded-xl border border-[#e7dbc9] bg-[#fffaf3] px-3 py-2 text-left text-sm text-[#3b2a1d] disabled:text-[#9b8b7c]"
                    disabled={!v.commune}
                >
                    {v.villageName || t("order.village", { defaultValue: "Village" })}
                </button>
                <MobilePicker
                    open={open === "village"}
                    onClose={() => setOpen(null)}
                    items={vByComm}
                    value={v.village}
                    onSelect={(code) => setLevel("village", code)}
                    label={t("order.village")}
                />
            </div>
            <div className="hidden md:block">
                <Dropdown
                    label={t("order.village")}
                    items={vByComm}
                    value={v.village}
                    onSelect={(code) => setLevel("village", code)}
                    disabled={!v.commune}
                />
            </div>
        </div>
    )
}
