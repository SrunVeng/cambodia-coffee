// src/pages/order/steps/Payment.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";
import { HandCoins, Check } from "lucide-react";
import { requestAbaPayment, createOrder, pollPaymentStatus } from "../../../api/api";
import { khrToUsd } from "../../../utils/currency.js";
import appData from "../../../data/data.json"; // for ABA_LOGO
import { useCart } from "../../../store/cart";

export default function Payment({ info = {}, totals = {}, onPaid, onBack }) {
    const { t, i18n } = useTranslation();
    const clearCart = useCart((s) => s.clear);

    const [method, setMethod] = useState("cod"); // 'cod' | 'aba'
    const [loading, setLoading] = useState(false);
    const [qr, setQr] = useState(null);
    const [paymentId, setPaymentId] = useState(null);
    const pollRef = useRef(null);

    // --- fallback sources to ensure items are always present ---
    const cartItems = useCart((s) => s.items);
    const items = useMemo(() => {
        if (Array.isArray(totals.items) && totals.items.length) return totals.items;
        if (Array.isArray(cartItems) && cartItems.length) return cartItems;
        try {
            const raw = localStorage.getItem("items");
            const arr = raw ? JSON.parse(raw) : [];
            if (Array.isArray(arr) && arr.length) return arr;
        } catch {}
        return [];
    }, [totals.items, cartItems]);

    const khrCurrency = totals.currency || "KHR";

    // Normalize (display only)
    const normalizedItems = useMemo(
        () =>
            items.map((it, i) => {
                const name = it.name || it.title || it.label || `Item ${i + 1}`;
                const qty = Number(it.qty ?? it.quantity ?? it.count ?? 1);
                const unitPrice = Number(it.unitPrice ?? it.price ?? it.amount ?? 0);
                const lineTotal = Number(it.total ?? qty * unitPrice);
                return {
                    sku: it.sku || it.code || it.id || null,
                    name,
                    qty,
                    unitPrice,
                    lineTotal,
                    raw: it,
                };
            }),
        [items]
    );

    // ---------- FIXED TOTALS LOGIC ----------
    // Always compute a subtotal from items; only trust an incoming subtotal if it's a valid positive number.
    // This prevents a bogus 0 from locking in and being forwarded to backend.
    const computedSubtotalKHR = normalizedItems.reduce(
        (s, x) => s + Number(x.lineTotal || 0),
        0
    );
    const providedSubtotalKHR = Number(totals?.subtotal);
    const subtotalKHR =
        Number.isFinite(providedSubtotalKHR) && providedSubtotalKHR > 0
            ? providedSubtotalKHR
            : computedSubtotalKHR;

    const deliveryFeeKHR = Number(totals?.deliveryFee ?? 0);

    // Keep total consistent; prefer a provided total only if it matches the computed value
    const computedTotalKHR = subtotalKHR + deliveryFeeKHR;
    const providedTotalKHR = Number(totals?.total);
    const totalKHR =
        Number.isFinite(providedTotalKHR) &&
        Math.abs(providedTotalKHR - computedTotalKHR) < 0.000001
            ? providedTotalKHR
            : computedTotalKHR;
    // ----------------------------------------

    // Build API payload in USD and forward geo fields + gmaps_search
    const payloadUSD = useMemo(() => {
        const a = info?.address || {};

        // Prefer trusted, else candidate, else raw geo, else preview
        const isPoint = (p) => p && typeof p.lat === "number" && typeof p.lng === "number";
        const coord =
            (a.geoTrusted && isPoint(a.geo)) ? a.geo :
                isPoint(a.geoCandidate) ? a.geoCandidate :
                    isPoint(a.geo) ? a.geo :
                        isPoint(a.geoPreview) ? a.geoPreview :
                            null;

        const gmaps_search =
            a.gmaps_search ||
            (coord ? `https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}` : undefined);

        const address = {
            // human-readable parts
            province: a.provinceName || "",
            district: a.districtName || "",
            commune: a.communeName || "",
            village: a.villageName || "",
            street: a.street || "",
            // codes
            provinceCode: a.province ?? null,
            districtCode: a.district ?? null,
            communeCode: a.commune ?? null,
            villageCode: a.village ?? null,
            // geo flags + data from Info.jsx safeAddr
            geoTrusted: !!a.geoTrusted,
            ...(a.geoTrusted && a.geo
                ? { geo: a.geo, geoAcc: a.geoAcc, geoSrc: a.geoSrc, geoConfirmed: true }
                : a.geoCandidate
                    ? { geoCandidate: a.geoCandidate, geoAcc: a.geoAcc, geoSrc: a.geoSrc }
                    : {}),
            ...(gmaps_search ? { gmaps_search } : {}),
        };

        const linesUSD = normalizedItems.map((x) => ({
            sku: x.sku,
            name: x.name,
            qty: Number(x.qty || 0),
            unitPrice: khrToUsd(x.unitPrice), // USD
            lineTotal: khrToUsd(x.lineTotal), // USD
            currency: "USD",
        }));

        const usdSubtotal = khrToUsd(subtotalKHR);
        const usdDelivery = khrToUsd(deliveryFeeKHR);
        const usdTotal = khrToUsd(totalKHR);

        return {
            method,
            amount: usdTotal,
            currency: "USD",
            language: i18n.language || "en",
            customer: {
                name: info.name || "",
                phone: info.phone || "",
                email: info.email || "",
            },
            address,
            items: linesUSD,

            // Top-level totals for backend (kept as numbers; backend can coerce to strings if needed)
            subtotal: usdSubtotal,
            deliveryFee: usdDelivery,
            total: usdTotal,

            // Summary/meta (reference/analytics)
            summary: {
                subtotal: usdSubtotal,
                deliveryFee: usdDelivery,
                total: usdTotal,
                currency: "USD",
                original: { currency: khrCurrency, subtotalKHR, deliveryFeeKHR, totalKHR },
            },
            meta: {
                submittedAt: new Date().toISOString(),
                source: "web",
                step: "payment",
                userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
                locale: typeof navigator !== "undefined" ? navigator.language : i18n.language,
                coords: coord || undefined,
                geoAcc: a.geoAcc,
                geoSrc: a.geoSrc,
                geoTrusted: !!a.geoTrusted,
                ...(gmaps_search ? { gmaps_search } : {}),
            },
        };
    }, [
        method,
        totalKHR,
        subtotalKHR,
        deliveryFeeKHR,
        normalizedItems,
        i18n.language,
        info,
        khrCurrency,
    ]);

    // Reset QR/poll on method change
    useEffect(() => {
        setQr(null);
        setPaymentId(null);
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, [method]);

    // Cleanup on unmount
    useEffect(
        () => () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        },
        []
    );

    async function handleCOD() {
        if (payloadUSD.amount <= 0) return;
        setLoading(true);
        try {
            const res = await createOrder({ ...payloadUSD, method: "cod" });
            try {
                localStorage.setItem("receipt", JSON.stringify(res));
            } catch {}
            clearCart();
            onPaid?.({ receipt: res });
        } catch (e) {
            console.error(e);
            alert(e?.message || "Failed to create order.");
        } finally {
            setLoading(false);
        }
    }

    async function handleABA() {
        if (payloadUSD.amount <= 0) return;
        setLoading(true);
        try {
            const res = await requestAbaPayment({ ...payloadUSD, method: "aba" }); // { paymentId, qrString }
            setPaymentId(res.paymentId);
            const dataUrl = await QRCode.toDataURL(res.qrString || String(res.paymentId));
            setQr(dataUrl);

            if (!pollRef.current) {
                let elapsedMs = 0;
                const interval = 3000;
                const timeoutMs = 180000; // 3 min safety stop
                pollRef.current = setInterval(async () => {
                    try {
                        elapsedMs += interval;
                        const st = await pollPaymentStatus(res.paymentId);
                        if (st.status === "paid") {
                            clearInterval(pollRef.current);
                            pollRef.current = null;
                            try {
                                localStorage.setItem("receipt", JSON.stringify(st));
                            } catch {}
                            clearCart();
                            onPaid?.({ receipt: st });
                        } else if (
                            elapsedMs >= timeoutMs ||
                            st.status === "expired" ||
                            st.status === "failed"
                        ) {
                            clearInterval(pollRef.current);
                            pollRef.current = null;
                            alert("Payment not completed. Please try again or choose COD.");
                        }
                    } catch {
                        // ignore transient poll errors
                    }
                }, interval);
            }
        } catch (e) {
            console.error(e);
            alert(e?.message || "Failed to start ABA payment.");
        } finally {
            setLoading(false);
        }
    }

    const money = (v) =>
        new Intl.NumberFormat(i18n.language || undefined, {
            style: "currency",
            currency: khrCurrency,
        }).format(Number(v || 0));

    const methods = useMemo(
        () => [
            {
                id: "cod",
                title: t("payment.cod", { defaultValue: "Cash on Delivery" }),
                desc: t("payment.cod_desc", {
                    defaultValue: "Pay with cash when your order arrives.",
                }),
                renderIcon: (active) => (
                    <span
                        className={[
                            "grid h-11 w-11 place-items-center rounded-xl border",
                            active ? "border-[#c9a44c] bg-white" : "border-[#e7dbc9] bg-white",
                        ].join(" ")}
                    >
            <HandCoins
                className={active ? "h-6 w-6 text-[#2d1a14]" : "h-6 w-6 text-[#6b5545]"}
            />
          </span>
                ),
                badge: null,
            },
            {
                id: "aba",
                title: t("payment.aba", { defaultValue: "ABA Pay" }),
                desc: t("payment.aba_desc", {
                    defaultValue: "Fast & secure via ABA QR code.",
                }),
                renderIcon: (active) => (
                    <span
                        className={[
                            "grid h-11 w-11 place-items-center rounded-xl border overflow-hidden",
                            active ? "border-[#c9a44c] bg-white" : "border-[#e7dbc9] bg-white",
                        ].join(" ")}
                    >
            <img
                src={appData.ABA_LOGO}
                alt="ABA"
                className="h-7 w-7 object-contain"
                draggable={false}
            />
          </span>
                ),
                badge: t("payment.recommended", { defaultValue: "Recommended" }),
            },
        ],
        [t, i18n.language]
    );

    const onKeyChoose = (e, idx) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setMethod(methods[idx].id);
        }
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            setMethod(methods[(idx + 1) % methods.length].id);
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            setMethod(methods[(idx - 1 + methods.length) % methods.length].id);
        }
    };

    return (
        <div className="space-y-4">
            {/* Method chooser */}
            <div
                role="radiogroup"
                aria-label={t("payment.choose_method", {
                    defaultValue: "Choose a payment method",
                })}
                className="grid gap-3 sm:grid-cols-2"
            >
                {methods.map((m, idx) => {
                    const active = method === m.id;
                    return (
                        <button
                            key={m.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            tabIndex={active ? 0 : -1}
                            onClick={() => setMethod(m.id)}
                            onKeyDown={(e) => onKeyChoose(e, idx)}
                            className={[
                                "relative flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44c]",
                                active
                                    ? "border-[#c9a44c] bg-gradient-to-br from-[#fff7e6] to-[#fffaf3] shadow-md"
                                    : "border-[#e7dbc9] bg-[#fffaf3] hover:border-[#d9c6a9]",
                            ].join(" ")}
                        >
                            {m.renderIcon(active)}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                  <span
                      className={active ? "font-semibold text-[#2d1a14]" : "font-semibold text-[#3b2a1d]"}
                  >
                    {m.title}
                  </span>
                                    {m.badge ? (
                                        <span className="rounded-full bg-[#c9a44c]/15 text-[#7a533f] text-[11px] px-2 py-0.5">
                      {m.badge}
                    </span>
                                    ) : null}
                                </div>
                                <p className="text-xs text-[#6b5545] mt-0.5 line-clamp-2">{m.desc}</p>
                            </div>
                            {active && (
                                <span className="absolute right-3 top-3 text-[#2d1a14]">
                  <Check className="h-5 w-5" />
                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* KHR summary (display to user) */}
            <div className="card p-4 rounded-2xl border border-[#e7dbc9] bg-[#fffaf3]">
                <div className="flex justify-between text-sm">
          <span className="text-[#6b5545]">
            {t("payment.subtotal", { defaultValue: "Subtotal" })}
          </span>
                    <span className="text-[#3b2a1d]">{money(subtotalKHR)}</span>
                </div>
                <div className="flex justify-between text-sm">
          <span className="text-[#6b5545]">
            {t("payment.delivery", { defaultValue: "Delivery" })}
          </span>
                    <span className="text-[#3b2a1d]">{money(deliveryFeeKHR)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-[#e7dbc9] mt-2">
                    <span className="text-[#3b2a1d]">{t("payment.total", { defaultValue: "Total" })}</span>
                    <span className="text-[#3b2a1d]">{money(totalKHR)}</span>
                </div>
            </div>

            {method === "aba" && (
                <div className="card p-6 text-center space-y-3 rounded-2xl border border-[#e7dbc9] bg-[#fffaf3]">
                    {qr ? (
                        <img src={qr} alt="ABA QR" className="mx-auto w-56 h-56" />
                    ) : (
                        <div className="text-sm text-[#6b5545]">
                            {loading
                                ? t("payment.generating_qr", { defaultValue: "Generating QR..." })
                                : t("payment.qr_hint", { defaultValue: "Click to generate the QR code." })}
                        </div>
                    )}
                    {paymentId && (
                        <div className="text-xs opacity-80">
                            {t("payment.payment_id", { defaultValue: "Payment ID" })}: {paymentId}
                        </div>
                    )}
                    <div className="text-sm opacity-80">
                        {t("payment.scan_wait", {
                            defaultValue: "Scan to pay. Waiting for confirmation...",
                        })}
                    </div>
                </div>
            )}

            <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={onBack} disabled={loading}>
                    {t("common.back", { defaultValue: "Back" })}
                </button>
                {method === "cod" ? (
                    <button
                        className="btn btn-primary"
                        disabled={loading || payloadUSD.amount <= 0}
                        onClick={handleCOD}
                    >
                        {loading
                            ? t("payment.processing", { defaultValue: "Processing..." })
                            : t("payment.confirm_cod", { defaultValue: "Confirm COD" })}
                    </button>
                ) : (
                    <button
                        className="btn btn-primary"
                        disabled={loading || payloadUSD.amount <= 0}
                        onClick={handleABA}
                    >
                        {loading
                            ? t("payment.generating", { defaultValue: "Generating..." })
                            : t("payment.generate_qr", { defaultValue: "Generate QR" })}
                    </button>
                )}
            </div>
        </div>
    );
}
