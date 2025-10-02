// src/pages/order/steps/Review.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { buildOrderRequestVo } from "../../../utils/orderPayload";

/* --- local helpers --- */
function readCartFromLocalStorage() {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem("items");
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

const normalizeLang = (lang) => {
    if (!lang) return "en";
    const l = String(lang).toLowerCase();
    if (l.startsWith("kh") || l.startsWith("km")) return "kh";
    if (l.startsWith("en")) return "en";
    return l.slice(0, 2);
};

export default function Review({ info = {}, summary = {}, onNext, onBack }) {
    const { t, i18n } = useTranslation();

    const address = info.address || {};
    const {
        provinceName, districtName, communeName, villageName, street,
        province, district, commune, village,
        geo, geoCandidate, geoPreview,
        geoSrc, geoTrusted, geoConfirmed,
        gmaps_search,
    } = address;

    // Address line for display
    const addressLine = useMemo(() => {
        const parts = [villageName, communeName, districtName, provinceName].filter(Boolean);
        return [street, parts.join(", ")].filter(Boolean).join(" • ");
    }, [street, villageName, communeName, districtName, provinceName]);

    // Currency/language contexts
    const currency = summary.currency || "USD"; // display currency
    const language = normalizeLang(i18n.language);
    const locale = i18n.language || "en-US";

    // Money formatter (for UI only)
    const money = (v) =>
        new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(v || 0));

    // Items from summary or local storage
    const items = useMemo(() => {
        if (Array.isArray(summary.items) && summary.items.length) return summary.items;
        return readCartFromLocalStorage();
    }, [summary.items]);

    // Build a safe, human list for the UI preview
    const safeItems = useMemo(() => {
        const lang = normalizeLang(i18n.language);
        return items.map((it, i) => {
            let name;
            if (typeof it.title === "object") {
                name = it.title[lang] || it.title.en || Object.values(it.title)[0];
            } else {
                name = it.title || it.name || it.label;
            }
            if (!name) name = t("review.item", { defaultValue: "Item" }) + " " + (i + 1);

            const qty = Number(it.qty ?? it.quantity ?? it.count ?? 1);
            const unitPrice = Number(it.unitPrice ?? it.price ?? it.amount ?? 0);
            const lineTotal = Number(it.total ?? qty * unitPrice);

            return { name, qty, unitPrice, lineTotal, sku: it.sku || it.code || it.id || null, raw: it };
        });
    }, [items, i18n.language, t]);

    // Summaries for UI preview; actual request is built by buildOrderRequestVo
    const subtotal = summary.subtotal ?? safeItems.reduce((s, x) => s + Number(x.lineTotal || 0), 0);
    const deliveryFee = summary.deliveryFee ?? 0;
    const total = summary.total ?? subtotal + Number(deliveryFee || 0);

    // Pick the best available geo for map preview + backend links
    const loc = geo || geoCandidate || geoPreview;
    const lat = loc?.lat;
    const lng = loc?.lng;
    const gmapsEmbed =
        lat && lng ? `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed` : null;
    const gmapsSearch =
        gmaps_search || (lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null);

    // Prepare the EXACT backend request VO
    const payload = useMemo(() => {
        return buildOrderRequestVo({
            method: summary.method || "cod",     // 'cod' | 'aba'
            language,
            currency,
            customer: { name: info.name || "", phone: info.phone || "", email: info.email || "" },
            address: {
                provinceName: provinceName || "",
                districtName: districtName || "",
                communeName: communeName || "",
                villageName: villageName || "",
                street: street || "",
                // The *_Code fields map to your select values
                province: province || "",
                district: district || "",
                commune: commune || "",
                village: village || "",

                // Geo fields
                geo: loc ? { lat: Number(lat), lng: Number(lng) } : undefined,
                geoSrc: geoSrc || (loc ? "manual" : undefined),
                geoTrusted: Boolean(geoTrusted),
                geoConfirmed: Boolean(geoConfirmed),
                gmaps_search: gmapsSearch || undefined,
            },
            items,                        // raw cart items; will be normalized inside util
            deliveryFee,
            // If you have a live KHR rate, pass it here; fallback is 4100 in util
            khrRate: window.__KHR_RATE__ ?? 4100,
            userAgent: (typeof navigator !== "undefined" && navigator.userAgent) || "unknown",
            step: "payment",
            source: "web",
            locale,
        });
    }, [
        summary.method, language, currency, info.name, info.phone, info.email,
        provinceName, districtName, communeName, villageName, street,
        province, district, commune, village,
        loc, lat, lng, geoSrc, geoTrusted, geoConfirmed, gmapsSearch,
        items, deliveryFee, locale
    ]);

    // Persist for debugging or later steps (optional)
    useEffect(() => {
        try {
            localStorage.setItem("order_request_vo", JSON.stringify(payload));
            localStorage.setItem("info", JSON.stringify(info || {}));
            localStorage.setItem("summary_preview", JSON.stringify({ currency, items, subtotal, deliveryFee, total }));
        } catch {}
    }, [payload, info, currency, items, subtotal, deliveryFee, total]);

    return (
        <div className="space-y-5">
            {/* Customer */}
            <div className="card p-4 rounded-2xl border border-[#e7dbc9] bg-[#fffaf3]">
                <div className="font-semibold text-[#3b2a1d] mb-2">
                    {t("review.customer", { defaultValue: "Customer" })}
                </div>
                <div className="text-sm text-[#3b2a1d]/90">
                    <span className="font-medium">{info.name || "—"}</span>
                    <span className="mx-2">•</span>
                    <span>{info.phone || "—"}</span>
                    {info.email ? (
                        <>
                            <span className="mx-2">•</span>
                            <span className="text-[#6b5545]">{info.email}</span>
                        </>
                    ) : null}
                </div>
            </div>

            {/* Address + Google Map preview (iframe only) */}
            <div className="card p-4 rounded-2xl border border-[#e7dbc9] bg-[#fffaf3]">
                <div className="font-semibold text-[#3b2a1d] mb-2">
                    {t("review.address", { defaultValue: "Address" })}
                </div>
                <div className="text-sm text-[#3b2a1d]/90">
                    {addressLine || t("review.no_address", { defaultValue: "—" })}
                </div>

                {gmapsEmbed && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-[#e7dbc9]">
                        <iframe
                            title="Delivery location"
                            src={gmapsEmbed}
                            width="100%"
                            height="260"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            style={{ border: 0, display: "block" }}
                        />
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="card p-4 rounded-2xl border border-[#e7dbc9] bg-[#fffaf3]">
                <div className="font-semibold text-[#3b2a1d] mb-3">
                    {t("review.order_items", { defaultValue: "Order Items" })}
                </div>
                {safeItems.length ? (
                    <div className="space-y-2">
                        {safeItems.map((it, i) => (
                            <div key={`${it.sku || it.name}-${i}`} className="flex items-center justify-between text-sm">
                                <div className="min-w-0">
                                    <div className="truncate text-[#3b2a1d]">{it.name}</div>
                                    <div className="text-xs text-[#857567]">
                                        {t("review.qty", { defaultValue: "Qty" })}: {it.qty}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[#3b2a1d]">{money(it.lineTotal)}</div>
                                    <div className="text-xs text-[#857567]">
                                        {money(it.unitPrice)} {t("review.each", { defaultValue: "ea" })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-[#857567]">{t("review.no_items", { defaultValue: "No items." })}</div>
                )}

                <div className="mt-4 border-t border-[#e7dbc9] pt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
            <span className="text-[#6b5545]">
              {t("review.subtotal", { defaultValue: "Subtotal" })}
            </span>
                        <span className="text-[#3b2a1d]">{money(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[#6b5545]">{t("review.delivery", { defaultValue: "Delivery" })}</span>
                        <span className="text-[#3b2a1d]">{money(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold pt-1">
                        <span className="text-[#3b2a1d]">{t("review.total", { defaultValue: "Total" })}</span>
                        <span className="text-[#3b2a1d]">{money(total)}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={onBack}>
                    {t("common.back", { defaultValue: "Back" })}
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() =>
                        onNext?.({
                            info,
                            summary: { currency, items, subtotal, deliveryFee, total, method: summary.method || "cod" },
                            // Provide the exact backend request VO to the next step
                            requestVo: payload,
                        })
                    }
                >
                    {t("common.next", { defaultValue: "Next" })}
                </button>
            </div>
        </div>
    );
}
