import { useForm } from "react-hook-form";
import AddressSelect from "../AddressSelect";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const normalizeLang = (L) => {
    const x = String(L || "en").toLowerCase();
    if (x === "km") return "kh";
    if (x === "zh") return "cn";
    return ["en", "kh", "cn"].includes(x) ? x : "en";
};

// Default fallbacks per error key (used if your locale file misses a key)
const ERR_DEFAULTS = {
    "address.required": "Please complete your address.",
    "errors.name_required": "Your name is required.",
    "errors.name_short": "Name is too short.",
    "errors.email_invalid": "Please enter a valid email.",
    "errors.phone_required": "Your phone number is required.",
    "errors.phone_invalid": "Use 6–20 digits (numbers, spaces, + or - allowed).",
};

export default function Info({ data, onNext }) {
    const { t, i18n } = useTranslation();

    const {
        register, handleSubmit, setError, clearErrors,
        formState: { errors, isValid, isSubmitting },
    } = useForm({
        defaultValues: { name: "", email: "", phone: "", ...(data || {}) },
        mode: "onChange",
    });

    const [addr, setAddr] = useState(data?.address || {});
    const canSubmit = useMemo(
        () =>
            isValid &&
            !!addr?.province &&
            !!addr?.district &&
            !!addr?.commune &&
            !!addr?.village &&
            !isSubmitting,
        [isValid, addr?.province, addr?.district, addr?.commune, addr?.village, isSubmitting]
    );

    // Use KEY (not translated text) so language switching re-renders with t()
    useEffect(() => {
        const ok = !!(addr?.province && addr?.district && addr?.commune && addr?.village);
        if (!ok) {
            setError("address", { type: "required", message: "address.required" });
        } else {
            clearErrors("address");
        }
    }, [addr, setError, clearErrors]);

    const submit = async (v) => {
        if (!canSubmit) return;
        const next = { ...v, address: addr };
        try { localStorage.setItem("info", JSON.stringify(next)); } catch {}
        await onNext?.(next);
    };

    const inputBase =
        "block w-full rounded-xl px-4 py-3 shadow-sm transition bg-[#fffaf3] " +
        "text-[#3b2a1d] placeholder-[#9b8b7c] border focus:outline-none focus:ring-2";
    const okRing = "border-[#e7dbc9] focus:border-[#c9a44c] focus:ring-[#c9a44c]";
    const errRing = "border-red-300 focus:border-red-400 focus:ring-red-300";

    // Pick localized names from AddressSelect value if present; fall back to default Name
    const L = normalizeLang(i18n.language);
    const pickName = (base) =>
        addr?.[`${base}Name${L.toUpperCase()}`] || // e.g., provinceNameKH / provinceNameCN (if you use upper)
        addr?.[`${base}Name${L.charAt(0).toUpperCase() + L.slice(1)}`] || // provinceNameKh / provinceNameCn
        addr?.[`${base}Name_${L}`] || // provinceName_kh / provinceName_cn
        addr?.[`${base}Name`] || // default (likely English)
        addr?.[base]?.name?.[L] || // if AddressSelect returns object with name map
        addr?.[base]?.name || // generic
        "";

    const selectedParts = [pickName("village"), pickName("commune"), pickName("district"), pickName("province")]
        .filter(Boolean)
        .join(", ");

    // Translate error message keys at render time
    const trErr = (key) => t(key, { defaultValue: ERR_DEFAULTS[key] || "Invalid value." });

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
                        {t("order.name", { defaultValue: "Full Name" })}
                        <span className="text-red-500"> *</span>
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
                    {errors.name && (
                        <p className="mt-1 text-xs text-red-600">
                            {trErr(errors.name.message)}
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#3b2a1d]">
                        {t("order.email", { defaultValue: "Email" })}{" "}
                        <span className="text-[#857567] font-normal">
              {t("common.optional", { defaultValue: "(optional)" })}
            </span>
                    </label>
                    <input
                        type="email"
                        autoComplete="email"
                        placeholder={t("order.email_placeholder", { defaultValue: "you@domain.com" })}
                        {...register("email", {
                            validate: (v) =>
                                !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "errors.email_invalid",
                        })}
                        className={`${inputBase} ${errors.email ? errRing : okRing}`}
                    />
                    {errors.email && (
                        <p className="mt-1 text-xs text-red-600">
                            {trErr(errors.email.message)}
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#3b2a1d]">
                        {t("order.phone", { defaultValue: "Phone" })}
                        <span className="text-red-500"> *</span>
                    </label>
                    <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder={t("order.phone_placeholder", { defaultValue: "+855 12 345 678" })}
                        {...register("phone", {
                            required: "errors.phone_required",
                            pattern: {
                                value: /^[0-9+\-\s]{6,20}$/i,
                                message: "errors.phone_invalid",
                            },
                        })}
                        className={`${inputBase} ${errors.phone ? errRing : okRing}`}
                    />
                    {errors.phone && (
                        <p className="mt-1 text-xs text-red-600">
                            {trErr(errors.phone.message)}
                        </p>
                    )}
                </div>
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-[#3b2a1d]">
                    {t("order.address", { defaultValue: "Address" })}
                    <span className="text-red-500"> *</span>
                </label>
                <div
                    className={`rounded-xl border ${errors.address ? "border-red-300" : "border-[#e7dbc9]"} bg-[#fffaf3] p-3 shadow-sm`}
                >
                    <AddressSelect value={addr} onChange={setAddr} />
                </div>

                {(addr.province || addr.provinceName) && (
                    <p className="mt-2 text-xs text-[#6b5545]">
                        {t("address.selected", { defaultValue: "Selected" })}: {selectedParts}
                    </p>
                )}

                {errors.address && (
                    <p className="mt-1 text-xs text-red-600">
                        {trErr(errors.address.message)}
                    </p>
                )}
            </div>

            <div className="pt-1">
                <button
                    type="submit"
                    disabled={!canSubmit}
                    aria-disabled={!canSubmit}
                    className={`inline-flex items-center justify-center rounded-xl px-5 py-3 font-medium transition
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            ${canSubmit
                        ? "bg-gradient-to-br from-[#4b2e24] to-[#2d1a14] text-white shadow-md focus-visible:ring-[#c9a44c]"
                        : "bg-[#e8dfd0] text-[#9b8b7c] cursor-not-allowed"}`}
                >
                    {t("common.next", { defaultValue: "Next" })}
                </button>
                <p className="mt-2 text-[11px] text-[#857567]">
                    {t("order.privacy_hint", { defaultValue: "We’ll never share your info. Only email is optional." })}
                </p>
            </div>
        </form>
    );
}
