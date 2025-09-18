import { useForm } from "react-hook-form"
import AddressSelect from "../AddressSelect"
import { useEffect, useMemo, useState, useCallback } from "react"
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

export default function Info({ data, onNext, onResetClick }) {
    const { t, i18n } = useTranslation()
    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        reset: resetForm, // <-- we’ll use this to clear inputs
        formState: { errors, isValid, isSubmitting },
    } = useForm({
        defaultValues: { name: "", email: "", phone: "", ...(data || {}) },
        mode: "onChange",
    })

    const [addr, setAddr] = useState(data?.address || {})

    // Keep inputs + address fully in sync with parent `data` (e.g., after LeaveGuard confirm reset)
    useEffect(() => {
        resetForm({
            name: data?.name || "",
            email: data?.email || "",
            phone: data?.phone || "",
        })
        setAddr(data?.address || {})
    }, [data, resetForm])

    const canSubmit = useMemo(
        () =>
            isValid &&
            !!addr?.province &&
            !!addr?.district &&
            !!addr?.commune &&
            !!addr?.village &&
            !isSubmitting,
        [isValid, addr?.province, addr?.district, addr?.commune, addr?.village, isSubmitting]
    )

    useEffect(() => {
        const ok = !!(addr?.province && addr?.district && addr?.commune && addr?.village)
        if (!ok) setError("address", { type: "required", message: "address.required" })
        else clearErrors("address")
    }, [addr, setError, clearErrors])

    const submit = async (v) => {
        if (!canSubmit) return
        const next = { ...v, address: addr }
        try {
            localStorage.setItem("info", JSON.stringify(next))
        } catch {}
        await onNext?.(next)
    }

    // Local clear (inputs + address). Called if no onResetClick is provided.
    const clearLocal = useCallback(() => {
        resetForm({ name: "", email: "", phone: "" })
        setAddr({})
        try {
            // Keep localStorage tidy in the fallback path
            localStorage.removeItem("info")
        } catch {}
    }, [resetForm])

    const handleResetPress = () => {
        if (onResetClick) onResetClick()   // parent will open LeaveGuard, confirm -> parent clears `data`
        else clearLocal()                  // fallback: clear locally if no guard provided
    }

    const inputBase =
        "block w-full rounded-xl px-4 py-3 shadow-sm transition bg-[#fffaf3] " +
        "text-[#3b2a1d] placeholder-[#9b8b7c] border focus:outline-none focus:ring-2"
    const okRing = "border-[#e7dbc9] focus:border-[#c9a44c] focus:ring-[#c9a44c]"
    const errRing = "border-red-300 focus:border-red-400 focus:ring-red-300"

    const L = normalizeLang(i18n.language)
    const trErr = (key) => t(key, { defaultValue: ERR_DEFAULTS[key] || "Invalid value." })

    const selectedParts = useMemo(() => {
        return [addr.villageName, addr.communeName, addr.districtName, addr.provinceName]
            .filter(Boolean)
            .join(", ")
    }, [addr.villageName, addr.communeName, addr.districtName, addr.provinceName])

    return (
        <form onSubmit={handleSubmit(submit)} className="space-y-6">
            <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#3b2a1d]">
                    {t("order.info", { defaultValue: "Customer Information" })}
                </h3>
                <p className="text-sm text-[#857567]">
                    {t("order.info_hint", { defaultValue: "We’ll use this to process your order and delivery." })}
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#3b2a1d]">
                        {t("order.name", { defaultValue: "Full Name" })}<span className="text-red-500"> *</span>
                    </label>
                    <input
                        type="text"
                        autoComplete="name"
                        placeholder={t("order.name_placeholder", { defaultValue: "e.g. Srey Neang" })}
                        {...register("name", {
                            required: "errors.name_required",
                            minLength: { value: 2, message: "errors.name_short" },
                        })}
                        className={`${inputBase} ${errors.name ? errRing : okRing}`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{trErr(errors.name.message)}</p>}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#3b2a1d]">
                        {t("order.email", { defaultValue: "Email" })}{" "}
                        <span className="text-[#857567] font-normal">{t("common.optional", { defaultValue: "(optional)" })}</span>
                    </label>
                    <input
                        type="email"
                        autoComplete="email"
                        placeholder={t("order.email_placeholder", { defaultValue: "you@domain.com" })}
                        {...register("email", {
                            validate: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "errors.email_invalid",
                        })}
                        className={`${inputBase} ${errors.email ? errRing : okRing}`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{trErr(errors.email.message)}</p>}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#3b2a1d]">
                        {t("order.phone", { defaultValue: "Phone" })}<span className="text-red-500"> *</span>
                    </label>
                    <input
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
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{trErr(errors.phone.message)}</p>}
                </div>
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-[#3b2a1d]">
                    {t("order.address", { defaultValue: "Address" })}<span className="text-red-500"> *</span>
                </label>

                <div className={`rounded-xl border ${errors.address ? "border-red-300" : "border-[#e7dbc9]"} bg-[#fffaf3] p-3 shadow-sm`}>
                    <AddressSelect value={addr} onChange={setAddr} lang={L} />
                </div>

                {(addr.province || addr.provinceName) && (
                    <p className="mt-2 text-xs text-[#6b5545]">
                        {t("address.selected", { defaultValue: "Selected" })}: {selectedParts}
                    </p>
                )}

                {errors.address && <p className="mt-1 text-xs text-red-600">{trErr(errors.address.message)}</p>}
            </div>

            {/* Actions row: Reset left, Next right */}
            <div className="pt-1">
                <div className="flex items-center justify-between">

                    <button
                        type="button"
                        onClick={handleResetPress}
                        className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-medium
                       bg-gradient-to-br from-red-600 to-red-700 text-white shadow-md
                       transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                    >
                        {t("common.reset", { defaultValue: "Reset" })}
                    </button>

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        aria-disabled={!canSubmit}
                        className={`inline-flex items-center justify-center rounded-xl px-5 py-3 font-medium transition
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                        ${
                            canSubmit
                                ? "bg-gradient-to-br from-[#4b2e24] to-[#2d1a14] text-white shadow-md focus-visible:ring-[#c9a44c]"
                                : "bg-[#e8dfd0] text-[#9b8b7c] cursor-not-allowed"
                        }`}
                    >
                        {t("common.next", { defaultValue: "Next" })}
                    </button>



                </div>

                <p className="mt-2 text-[11px] text-[#857567]">
                    {t("order.privacy_hint", { defaultValue: "We’ll never share your info. Only email is optional." })}
                </p>
            </div>
        </form>
    )
}
