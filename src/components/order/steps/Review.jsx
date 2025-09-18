import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { buildOrderPayload } from "../../../utils/orderPayload";

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

export default function Review({ info = {}, summary = {}, onNext, onBack }) {
    const { t, i18n } = useTranslation();

    const address = info.address || {};
    const { provinceName, districtName, communeName, villageName, street } = address;

    const addressLine = useMemo(() => {
        const parts = [villageName, communeName, districtName, provinceName].filter(Boolean);
        return [street, parts.join(", ")].filter(Boolean).join(" • ");
    }, [street, villageName, communeName, districtName, provinceName]);

    const currency = summary.currency || "KHR";
    const locale = i18n.language || "en";
    const money = (v) => new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(v || 0));

    const items = useMemo(() => {
        if (Array.isArray(summary.items) && summary.items.length) return summary.items;
        return readCartFromLocalStorage();
    }, [summary.items]);

    const safeItems = useMemo(() => {
        return items.map((it, i) => {
            const name = it.name || it.title || it.label || `${t("review.item", { defaultValue: "Item" })} ${i + 1}`;
            const qty = Number(it.qty ?? it.quantity ?? it.count ?? 1);
            const unitPrice = Number(it.unitPrice ?? it.price ?? it.amount ?? 0);
            const lineTotal = Number(it.total ?? qty * unitPrice);
            return { name, qty, unitPrice, lineTotal, sku: it.sku || it.code || it.id || null, raw: it };
        });
    }, [items, t]);

    const subtotal = summary.subtotal ?? safeItems.reduce((s, x) => s + Number(x.lineTotal || 0), 0);
    const deliveryFee = summary.deliveryFee ?? 0;
    const total = summary.total ?? subtotal + Number(deliveryFee || 0);

    const payload = useMemo(() => {
        return buildOrderPayload({
            customer: { name: info.name || "", phone: info.phone || "", email: info.email || "" },
            address: {
                provinceName: provinceName || "",
                districtName: districtName || "",
                communeName: communeName || "",
                villageName: villageName || "",
                street: street || "",
                province: address.province || null,
                district: address.district || null,
                commune: address.commune || null,
                village: address.village || null,
            },
            items,
            currency,
            deliveryFee,
            locale,
            meta: { source: "web" },
        });
    }, [
        info.name, info.phone, info.email,
        provinceName, districtName, communeName, villageName, street,
        address.province, address.district, address.commune, address.village,
        items, currency, deliveryFee, locale
    ]);

    useEffect(() => {
        try {
            localStorage.setItem("order_payload", JSON.stringify(payload));
            localStorage.setItem("info", JSON.stringify(info || {}));
            localStorage.setItem("summary", JSON.stringify({ currency, items, subtotal, deliveryFee, total }));
        } catch {}
    }, [payload, info, currency, items, subtotal, deliveryFee, total]);

    return (
        <div className="space-y-5">
            <div className="card p-4 rounded-2xl border border-[#e7dbc9] bg-[#fffaf3]">
                <div className="font-semibold text-[#3b2a1d] mb-2">{t("review.customer", { defaultValue: "Customer" })}</div>
                <div className="text-sm text-[#3b2a1d]/90">
                    <span className="font-medium">{info.name || "—"}</span><span className="mx-2">•</span>
                    <span>{info.phone || "—"}</span>
                    {info.email ? <><span className="mx-2">•</span><span className="text-[#6b5545]">{info.email}</span></> : null}
                </div>
            </div>

            <div className="card p-4 rounded-2xl border border-[#e7dbc9] bg-[#fffaf3]">
                <div className="font-semibold text-[#3b2a1d] mb-2">{t("review.address", { defaultValue: "Address" })}</div>
                <div className="text-sm text-[#3b2a1d]/90">
                    {addressLine || t("review.no_address", { defaultValue: "—" })}
                </div>
            </div>

            <div className="card p-4 rounded-2xl border border-[#e7dbc9] bg-[#fffaf3]">
                <div className="font-semibold text-[#3b2a1d] mb-3">{t("review.order_items", { defaultValue: "Order Items" })}</div>
                {safeItems.length ? (
                    <div className="space-y-2">
                        {safeItems.map((it, i) => (
                            <div key={`${it.sku || it.name}-${i}`} className="flex items-center justify-between text-sm">
                                <div className="min-w-0">
                                    <div className="truncate text-[#3b2a1d]">{it.name}</div>
                                    <div className="text-xs text-[#857567]">{t("review.qty", { defaultValue: "Qty" })}: {it.qty}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[#3b2a1d]">{money(it.lineTotal)}</div>
                                    <div className="text-xs text-[#857567]">{money(it.unitPrice)} {t("review.each", { defaultValue: "ea" })}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-[#857567]">{t("review.no_items", { defaultValue: "No items." })}</div>
                )}

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

            <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={onBack}>{t("common.back", { defaultValue: "Back" })}</button>
                <button className="btn btn-primary" onClick={() => onNext?.({ info, summary: { currency, items, subtotal, deliveryFee, total } })}>
                    {t("common.next", { defaultValue: "Next" })}
                </button>
            </div>
        </div>
    );
}
