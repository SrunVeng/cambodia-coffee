import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

export default function Review({ info = {}, summary = {}, onNext, onBack }) {
    const { t, i18n } = useTranslation();

    const address = info.address || {};
    const {
        provinceName,
        districtName,
        communeName,
        villageName,
        street,
    } = address;

    // Human-readable address line
    const addressLine = useMemo(() => {
        const parts = [villageName, communeName, districtName, provinceName].filter(Boolean);
        return [street, parts.join(", ")].filter(Boolean).join(" • ");
    }, [street, villageName, communeName, districtName, provinceName]);

    const currency = summary.currency || "USD";
    const locale = i18n.language || "en";
    const money = (v) =>
        new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(v || 0));

    // Normalize items for display + payload
    const items = Array.isArray(summary.items) ? summary.items : [];
    const safeItems = useMemo(
        () =>
            items.map((it, i) => {
                const name = it.name || it.title || it.label || `${t("review.item", { defaultValue: "Item" })} ${i + 1}`;
                const qty = it.qty ?? it.quantity ?? it.count ?? 1;
                const unitPrice = Number(it.unitPrice ?? it.price ?? it.amount ?? 0);
                const lineTotal = Number(it.total ?? qty * unitPrice);
                return { name, qty, unitPrice, lineTotal, sku: it.sku || it.id || null, raw: it };
            }),
        [items, t]
    );

    const subtotal = summary.subtotal ?? safeItems.reduce((s, x) => s + Number(x.lineTotal || 0), 0);
    const deliveryFee = summary.deliveryFee ?? 0;
    const total = summary.total ?? subtotal + Number(deliveryFee || 0);

    // API-ready payload
    const payload = useMemo(
        () => ({
            customer: {
                name: info.name || "",
                phone: info.phone || "",
                email: info.email || "",
            },
            address: {
                // display-friendly
                province: provinceName || "",
                district: districtName || "",
                commune: communeName || "",
                village: villageName || "",
                street: street || "",
                // keep codes if backend needs them
                provinceCode: address.province || null,
                districtCode: address.district || null,
                communeCode: address.commune || null,
                villageCode: address.village || null,
            },
            cart: {
                items, // keep original structure too
                normalized: safeItems, // plus normalized lines
                currency,
                subtotal,
                deliveryFee,
                total,
            },
            meta: {
                submittedAt: new Date().toISOString(),
                locale,
            },
        }),
        [
            info.name, info.phone, info.email,
            provinceName, districtName, communeName, villageName, street,
            address.province, address.district, address.commune, address.village,
            items, safeItems, currency, subtotal, deliveryFee, total, locale
        ]
    );

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

            {/* Address (names only) */}
            <div className="card p-4 rounded-2xl border border-[#e7dbc9] bg-[#fffaf3]">
                <div className="font-semibold text-[#3b2a1d] mb-2">
                    {t("review.address", { defaultValue: "Address" })}
                </div>
                <div className="text-sm text-[#3b2a1d]/90">
                    {addressLine || t("review.no_address", { defaultValue: "—" })}
                </div>
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

                {/* Totals */}
                <div className="mt-4 border-t border-[#e7dbc9] pt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-[#6b5545]">{t("review.subtotal", { defaultValue: "Subtotal" })}</span>
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
                <button className="btn btn-primary" onClick={() => onNext?.(payload)}>
                    {t("review.proceed_payment", { defaultValue: "Proceed to Payment" })}
                </button>
            </div>
        </div>
    );
}
