import { useForm } from "react-hook-form"
import AddressSelect from "../AddressSelect"
import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"

const normalizeLang = (L) => {
    const x = String(L || "en").toLowerCase()
    if (x === "km" || x.startsWith("km-") || x === "kh" || x.startsWith("kh-")) return "kh"
    if (x === "zh" || x.startsWith("zh-") || x === "cn" || x.startsWith("cn-")) return "cn"
    return ["en", "kh", "cn"].includes(x) ? x : "en"
}

const ERR_DEFAULTS = {
    "address.required": "Please complete your address.",
    "errors.name_required": "Your name is required.",
    "errors.name_short": "Name is too short.",
    "errors.email_invalid": "Please enter a valid email.",
    "errors.phone_required": "Your phone number is required.",
    "errors.phone_invalid": "Use a valid phone number.",
}

// ---------- small UI helpers ----------
const Icon = {
    User: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"h-4 w-4 "+(p.className||"")}>
            <path strokeWidth="1.5" d="M20 21a8 8 0 10-16 0"/>
            <circle cx="12" cy="7" r="4" strokeWidth="1.5"/>
        </svg>
    ),
    Mail: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"h-4 w-4 "+(p.className||"")}>
            <path strokeWidth="1.5" d="M4 6h16v12H4z"/>
            <path strokeWidth="1.5" d="M4 7l8 6 8-6"/>
        </svg>
    ),
    Phone: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"h-4 w-4 "+(p.className||"")}>
            <path strokeWidth="1.5" d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011.1-.2 11 11 0 003.5.6 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h2.4a1 1 0 011 1 11 11 0 00.6 3.5 1 1 0 01-.2 1.1l-2.2 2.2z"/>
        </svg>
    ),
    MapPin: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"h-4 w-4 "+(p.className||"")}>
            <path strokeWidth="1.5" d="M12 22s7-6.1 7-12a7 7 0 10-14 0c0 5.9 7 12 7 12z"/>
            <circle cx="12" cy="10" r="3" strokeWidth="1.5"/>
        </svg>
    ),
    RotateCcw: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"h-4 w-4 "+(p.className||"")}>
            <path strokeWidth="1.5" d="M1 4v6h6"/>
            <path strokeWidth="1.5" d="M3.5 13A8.5 8.5 0 1120 8"/>
        </svg>
    ),
    ArrowRight: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={"h-4 w-4 "+(p.className||"")}>
            <path strokeWidth="1.5" d="M5 12h14M13 5l7 7-7 7"/>
        </svg>
    ),
}

function Field({ id, label, required, error, hint, leadingIcon, children }) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-[#3b2a1d]">
                {leadingIcon}
                <span>
          {label}
                    {required && <span className="ml-1 text-red-500" aria-hidden>*</span>}
        </span>
            </label>
            {children}
            {error ? (
                <p className="text-xs text-red-600" role="alert">{error}</p>
            ) : hint ? (
                <p className="text-xs text-[#857567]">{hint}</p>
            ) : null}
        </div>
    )
}

export default function Info({ data, onNext, onResetClick }) {
    const { t, i18n } = useTranslation()
    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        reset: resetForm,
        formState: { errors, isValid, isSubmitting },
    } = useForm({
        defaultValues: { name: "", email: "", phone: "", ...(data || {}) },
        mode: "onChange",
    })

    const [addr, setAddr] = useState(data?.address || {})
    const [geoBusy, setGeoBusy] = useState(false)
    const L = normalizeLang(i18n.language)
    const toErr = (key) => t(key, { defaultValue: ERR_DEFAULTS[key] || "Invalid value." })

    // sync down when parent resets
    useEffect(() => {
        resetForm({ name: data?.name || "", email: data?.email || "", phone: data?.phone || "" })
        setAddr(data?.address || {})
    }, [data, resetForm])

    const canSubmit = useMemo(
        () => isValid && !!addr?.province && !!addr?.district && !!addr?.commune && !!addr?.village && !isSubmitting,
        [isValid, addr?.province, addr?.district, addr?.commune, addr?.village, isSubmitting]
    )

    useEffect(() => {
        const ok = !!(addr?.province && addr?.district && addr?.commune && addr?.village)
        if (!ok) setError("address", { type: "required", message: "address.required" })
        else clearErrors("address")
    }, [addr, setError, clearErrors])

    const selectedParts = useMemo(() => {
        return [addr.villageName, addr.communeName, addr.districtName, addr.provinceName].filter(Boolean).join(", ")
    }, [addr.villageName, addr.communeName, addr.districtName, addr.provinceName])

    const submit = async (v) => {
        if (!canSubmit) return
        const next = { ...v, address: addr }
        try { localStorage.setItem("info", JSON.stringify(next)) } catch {}
        await onNext?.(next)
    }

    const clearLocal = useCallback(() => {
        resetForm({ name: "", email: "", phone: "" })
        setAddr({})
        try { localStorage.removeItem("info") } catch {}
    }, [resetForm])

    const handleResetPress = () => {
        if (onResetClick) onResetClick()
        else clearLocal()
    }

    const inputBase =
        "block w-full rounded-xl px-4 py-3 shadow-sm transition bg-[#fffaf3] text-[#3b2a1d] placeholder-[#9b8b7c] border focus:outline-none focus:ring-2"
    const okRing = "border-[#e7dbc9] focus:border-[#c9a44c] focus:ring-[#c9a44c]"
    const errRing = "border-red-300 focus:border-red-400 focus:ring-red-300"

    // gently try to get geolocation and store in addr.geo
    const handleUseLocation = () => {
        if (!navigator?.geolocation) return
        setGeoBusy(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords || {}
                setAddr((a) => ({ ...a, geo: { lat: latitude, lng: longitude } }))
                setGeoBusy(false)
            },
            () => setGeoBusy(false),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        )
    }

    // focus ring helper for card actions
    const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#c9a44c]"

    return (
        <form onSubmit={handleSubmit(submit)} className="space-y-6">
            {/* Card shell with subtle vintage gradient border */}
            <div className="rounded-2xl bg-gradient-to-br from-[#efe6d6] to-[#f7efe3] p-[1px] shadow-md">
                <div className="rounded-2xl bg-[#fffbf3] p-6 sm:p-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-[#3b2a1d]">
                            {t("order.info", { defaultValue: "Customer Information" })}
                        </h3>
                        <p className="mt-1 text-sm text-[#857567]">
                            {t("order.info_hint", { defaultValue: "We’ll use this to process your order and delivery." })}
                        </p>
                    </div>

                    {/* Grid fields */}
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                            id="name"
                            label={t("order.name", { defaultValue: "Full Name" })}
                            required
                            leadingIcon={<Icon.User className="text-[#6b5545]" />}
                            error={errors.name && toErr(errors.name.message)}
                        >
                            <input
                                id="name"
                                type="text"
                                autoComplete="name"
                                placeholder={t("order.name_placeholder", { defaultValue: "e.g. Srey Neang" })}
                                {...register("name", {
                                    required: "errors.name_required",
                                    minLength: { value: 2, message: "errors.name_short" },
                                })}
                                className={`${inputBase} ${errors.name ? errRing : okRing}`}
                            />
                        </Field>

                        <Field
                            id="email"
                            label={t("order.email", { defaultValue: "Email" })}
                            hint={t("common.optional", { defaultValue: "(optional)" })}
                            leadingIcon={<Icon.Mail className="text-[#6b5545]" />}
                            error={errors.email && toErr(errors.email.message)}
                        >
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder={t("order.email_placeholder", { defaultValue: "you@domain.com" })}
                                {...register("email", {
                                    validate: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "errors.email_invalid",
                                })}
                                className={`${inputBase} ${errors.email ? errRing : okRing}`}
                            />
                        </Field>

                        <Field
                            id="phone"
                            label={t("order.phone", { defaultValue: "Phone" })}
                            required
                            leadingIcon={<Icon.Phone className="text-[#6b5545]" />}
                            error={errors.phone && toErr(errors.phone.message)}
                        >
                            <input
                                id="phone"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder={t("order.phone_placeholder", { defaultValue: "+855 12 345 678" })}
                                {...register("phone", {
                                    required: "errors.phone_required",
                                    pattern: { value: /^[+0-9()\-\s]{6,20}$/, message: "errors.phone_invalid" },
                                })}
                                className={`${inputBase} ${errors.phone ? errRing : okRing}`}
                            />
                        </Field>

                        {/* Street / house (optional, kept outside AddressSelect so you can capture precise directions) */}
                        <Field
                            id="street"
                            label={t("order.street", { defaultValue: "Street, house no. (optional)" })}
                            hint={t("order.street_hint", { defaultValue: "Add nearby landmark or apartment, if helpful." })}
                        >
                            <input
                                id="street"
                                type="text"
                                placeholder={t("order.street_placeholder", { defaultValue: "Street 123, House 45, near market" })}
                                value={addr?.street || ""}
                                onChange={(e) => setAddr((a) => ({ ...(a || {}), street: e.target.value }))}
                                className={`${inputBase} ${okRing}`}
                            />
                        </Field>
                    </div>

                    {/* Address picker */}
                    <div className="mt-5 space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-[#3b2a1d]">
                            <Icon.MapPin className="text-[#6b5545]" />
                            <span>
                {t("order.address", { defaultValue: "Address" })}
                                <span className="ml-1 text-red-500" aria-hidden>*</span>
              </span>
                        </label>

                        <div className={`rounded-xl border ${errors.address ? "border-red-300" : "border-[#e7dbc9]"} bg-[#fffaf3] p-3 shadow-sm`}>
                            <AddressSelect value={addr} onChange={setAddr} lang={L} />

                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                {(addr.province || addr.provinceName) ? (
                                    <p className="text-xs text-[#6b5545]">
                                        {t("address.selected", { defaultValue: "Selected" })}: {selectedParts || "—"}
                                    </p>
                                ) : (
                                    <p className="text-xs text-[#6b5545]">{t("address.choose_hint", { defaultValue: "Choose province → district → commune → village." })}</p>
                                )}

                                {/* Use current location (optional) */}
                                <button
                                    type="button"
                                    onClick={handleUseLocation}
                                    disabled={geoBusy}
                                    className={`inline-flex items-center gap-2 self-start rounded-lg border border-[#e7dbc9] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#3b2a1d] shadow-sm transition hover:bg-white ${focusRing} disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                    <Icon.MapPin />
                                    {geoBusy ? t("address.locating", { defaultValue: "Locating…" }) : t("address.use_current", { defaultValue: "Use current location" })}
                                </button>
                            </div>
                        </div>

                        {addr?.geo?.lat && addr?.geo?.lng && (
                            <p className="text-[11px] text-[#857567]">{t("address.pinned", { defaultValue: "Pinned" })}: {addr.geo.lat.toFixed(5)}, {addr.geo.lng.toFixed(5)}</p>
                        )}

                        {errors.address && <p className="text-xs text-red-600" role="alert">{toErr(errors.address.message)}</p>}
                    </div>

                    {/* Footer actions */}
                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={handleResetPress}
                            className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-red-600 to-red-700 px-5 py-3 font-medium text-white shadow-md transition ${focusRing}`}
                        >
                            <Icon.RotateCcw /> {t("common.reset", { defaultValue: "Reset" })}
                        </button>

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            aria-disabled={!canSubmit}
                            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition ${focusRing} ${
                                canSubmit
                                    ? "bg-gradient-to-br from-[#4b2e24] to-[#2d1a14] text-white shadow-md"
                                    : "bg-[#e8dfd0] text-[#9b8b7c] cursor-not-allowed"
                            }`}
                        >
                            {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />}
                            {!isSubmitting && <Icon.ArrowRight />}
                            {t("common.next", { defaultValue: "Next" })}
                        </button>
                    </div>

                    <p className="mt-3 text-[11px] text-[#857567]">
                        {t("order.privacy_hint", { defaultValue: "We’ll never share your info. Only email is optional." })}
                    </p>
                </div>
            </div>
        </form>
    )
}
