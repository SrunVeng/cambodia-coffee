// src/pages/order/Receipt.jsx
import { useEffect, useMemo, useState, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Printer, Download, Clipboard, ClipboardCheck, MapPin, User, Phone, Mail, RotateCcw } from "lucide-react";

/**
 * Receipt
 * - Same props: ({ data, onRestart })
 * - UI upgrades: copy order no., refined status badge, improved spacing/print, safe number formatting.
 */
export default function Receipt({ data, onRestart }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [receipt, setReceipt] = useState(data || null);
    const [copied, setCopied] = useState(false);

    // --- brand color (used by the thin top bar) ---
    useEffect(() => {
        const root = document.documentElement;
        if (!root.style.getPropertyValue("--brand-accent")) {
            root.style.setProperty("--brand-accent", "#a37b59");
        }
        if (!root.style.getPropertyValue("--brand-ink")) {
            root.style.setProperty("--brand-ink", "#0f172a"); // slate-900
        }
    }, []);

    // Persist latest + append to receipts list (dedupe by order id)
    useEffect(() => {
        if (!receipt) return;
        const getId = (r) => {
            let src = r;
            if (src?.data) src = src.data;
            if (src?.result) src = src.result;
            if (src?.receipt) src = src.receipt;
            if (src?.order) src = { ...src, ...src.order };
            return src?.orderNo || src?.orderId || src?.paymentId || src?.id || src?.reference || null;
        };
        try {
            localStorage.setItem("receipt", JSON.stringify(receipt));
            const id = getId(receipt);
            const list = JSON.parse(localStorage.getItem("receipts") || "[]");
            const filtered = id ? list.filter((x) => getId(x) !== id) : list;
            const next = [receipt, ...filtered].slice(0, 50);
            localStorage.setItem("receipts", JSON.stringify(next));
        } catch {}
    }, [receipt]);

    // --- header offset (avoid being attached to fixed/sticky header) ---
    const DEFAULT_HEADER_H = 64; // px fallback
    const EXTRA_GAP = 16;
    const [topPad, setTopPad] = useState(DEFAULT_HEADER_H + EXTRA_GAP);

    useLayoutEffect(() => {
        const findHeaderHeight = () => {
            const el =
                document.querySelector("[data-app-header]") ||
                document.querySelector("header[role='banner']") ||
                document.querySelector("header.fixed, header.sticky") ||
                document.querySelector("header");
            return (el?.offsetHeight || DEFAULT_HEADER_H) + EXTRA_GAP;
        };
        const update = () => setTopPad(findHeaderHeight());
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    // Load from localStorage if not provided via props
    useEffect(() => {
        if (!receipt) {
            try {
                const raw = localStorage.getItem("receipt");
                if (raw) setReceipt(JSON.parse(raw));
            } catch {/* ignore */}
        }
    }, [receipt]);

    // ----- helpers -----
    const nonEmpty = (v) => (v !== undefined && v !== null && String(v).trim() !== "" ? v : "—");

    const formatDateTime = (val) => {
        if (!val) return "—";
        let src = val;
        if (typeof src === "string" && src.includes(" ") && !src.includes("T")) {
            src = src.replace(" ", "T");
        }
        const d = new Date(src);
        if (isNaN(d.getTime())) return String(val);
        return d.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    };

    const statusTone = (s) => {
        const v = String(s || "").toLowerCase();
        if (/(success|paid|complete|approved)/.test(v)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (/(unpaid)/.test(v)) return "bg-rose-50 text-rose-700 border-rose-200";
        if (/(pending|processing|created|initiated)/.test(v)) return "bg-amber-50 text-amber-700 border-amber-200";
        if (/(fail|cancel|expired|error|declined)/.test(v)) return "bg-rose-50 text-rose-700 border-rose-200";
        return "bg-slate-50 text-slate-700 border-slate-200";
    };

    const fmtMoney = (v, currency) => {
        if (v === "—" || v === null || v === undefined) return "—";
        const n = Number(v);
        if (!Number.isFinite(n)) return String(v);
        try {
            return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
        } catch {
            // fallback if unknown currency code—keep original number + currency suffix
            return `${n.toFixed(2)} ${currency || ""}`.trim();
        }
    };

    // Parse Java-style toString list: [OrderRequestDto.Item(...), ...]
    const parseOrderItemsString = (s) => {
        if (typeof s !== "string" || s.trim() === "") return null;
        const items = [];
        const pattern = /OrderRequestDto\.Item\((.*?)\)/g;
        let m;
        while ((m = pattern.exec(s)) !== null) {
            const block = m[1];
            const name = /name=([^,)\]]+)/.exec(block)?.[1]?.trim();
            const qtyStr = /qty=([^,)\]]+)/.exec(block)?.[1]?.trim();
            const unitPriceStr = /unitPrice=([^,)\]]+)/.exec(block)?.[1]?.trim();
            const lineTotalStr = /lineTotal=([^,)\]]+)/.exec(block)?.[1]?.trim();
            const qty = qtyStr != null && !Number.isNaN(Number(qtyStr)) ? Number(qtyStr) : qtyStr || "—";
            const unit = unitPriceStr != null && !Number.isNaN(Number(unitPriceStr)) ? String(unitPriceStr) : unitPriceStr || "—";
            const lineTotal = lineTotalStr != null && !Number.isNaN(Number(lineTotalStr)) ? String(lineTotalStr) : lineTotalStr || "—";
            items.push({ name: nonEmpty(name), qty, unit, lineTotal });
        }
        return items.length ? items : null;
    };

    // ----- normalize any shape → flat object we can render -----
    const R = useMemo(() => {
        if (!receipt) return null;

        // unwrap envelopes
        let src = receipt;
        if (src && typeof src === "object") {
            if (src.data && typeof src.data === "object") src = src.data;
            if (src.result && typeof src.result === "object") src = src.result;
            if (src.receipt && typeof src.receipt === "object") src = src.receipt;
            if (src.order && typeof src.order === "object") src = { ...src, ...src.order };
        }

        // status / method
        const txStatus =
            src.paymentStatus ||
            src.state ||
            src.orderStatus ||
            (typeof src.status === "string" ? src.status : null);

        const methodKey = String(src.paymentMethod || src.method || "").toLowerCase();
        const methodLabel =
            methodKey === "cod"
                ? t("receipt.method.cod", { defaultValue: "Cash on Delivery" })
                : methodKey === "aba"
                    ? t("receipt.method.aba", { defaultValue: "ABA Pay" })
                    : nonEmpty(src.paymentMethod || src.method);

        // address
        const adr = src.address || {};
        const address = {
            street: nonEmpty(src.street ?? adr.street),
            village: nonEmpty(src.village ?? adr.village),
            commune: nonEmpty(src.commune ?? adr.commune),
            district: nonEmpty(src.district ?? adr.district),
            province: nonEmpty(src.province ?? adr.province),
            gmaps: nonEmpty(src.gmaps_search ?? adr.gmaps_search ?? adr.gmapsSearch),
        };

        // items
        let items = null;
        const pickItems = src.items || src.orderItems || src.cart?.items || src.summary?.items || null;

        const mapItem = (it, idx) => {
            const name = it?.name ?? it?.title ?? it?.productName ?? `Item ${idx + 1}`;
            const qty = it?.qty ?? it?.quantity ?? it?.count ?? 1;
            const unit = it?.unitPrice ?? it?.price ?? it?.amount ?? it?.unit_amount ?? null;
            const total =
                it?.lineTotal ??
                it?.total ??
                it?.subtotal ??
                (unit != null ? Number(unit) * Number(qty) : null);
            return {
                name: nonEmpty(name),
                qty: Number.isFinite(Number(qty)) ? Number(qty) : nonEmpty(qty),
                unit: unit != null ? String(unit) : "—",
                lineTotal: total != null ? String(total) : "—",
            };
        };

        if (Array.isArray(pickItems) && pickItems.length) {
            items = pickItems.map(mapItem);
        } else if (typeof pickItems === "string") {
            let parsed = null;
            try { parsed = JSON.parse(pickItems); } catch {}
            if (Array.isArray(parsed) && parsed.length) {
                items = parsed.map(mapItem);
            } else {
                items = parseOrderItemsString(pickItems);
            }
        }

        const when = src.orderDate || src.createdAt || src.submittedAt || src.timestamp || src.date;
        const currency = nonEmpty(src.currency || src.summary?.currency || "USD");

        return {
            orderNo: nonEmpty(
                src.orderNo || src.orderId || src.paymentId || src.id || src.reference
            ),
            status: nonEmpty(txStatus),
            method: methodLabel,
            currency,
            subtotal: nonEmpty(src.subtotal ?? src.summary?.subtotal ?? src.amountBreakdown?.subtotal),
            deliveryFee: nonEmpty(src.deliveryFee ?? src.summary?.deliveryFee),
            total: nonEmpty(src.total ?? src.amount ?? src.summary?.total),
            name: nonEmpty(src.name ?? src.customer?.name),
            phone: nonEmpty(src.phoneNumber ?? src.customer?.phone),
            email: nonEmpty(src.email ?? src.customer?.email),
            addr: address,
            items,
            when: when ? formatDateTime(when) : "—",
        };
    }, [receipt, t]);

    if (!R) {
        return (
            <div className="text-sm text-center py-20">
                {t("receipt.missing", { defaultValue: "No receipt found." })}
            </div>
        );
    }

    const Row = ({ label, value, mono }) => (
        <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-slate-500">{label}</span>
            <span className={["text-slate-800", mono ? "font-mono" : ""].join(" ")}>
        {value}
      </span>
        </div>
    );

    const printReceipt = () => window.print();
    const handleCopy = async () => {
        try {
            await navigator.clipboard?.writeText?.(R.orderNo);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {}
    };

    return (
        <div
            className="w-full flex justify-center pb-24 bg-slate-50"
            style={{ paddingTop: topPad }}
        >
            {/* Print isolation: only the ticket prints */}
            <style>{`
        @media print {
          @page { margin: 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute !important; left: 0; top: 0; width: 100% !important; }
          .no-print { display: none !important; }
        }
      `}</style>

            <div className="w-full max-w-md print:max-w-full print:w-[720px]">
                <div className="print-area">
                    {/* Ticket */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
                        {/* Brand accent bar with subtle gradient */}
                        <div
                            className="h-1.5"
                            style={{
                                background:
                                    "linear-gradient(90deg, var(--brand-accent,#a37b59), color-mix(in oklab, var(--brand-accent,#a37b59) 70%, white))"
                            }}
                        />

                        {/* Header */}
                        <div className="px-5 pt-5 pb-3 border-b border-dashed border-slate-200">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-xs uppercase tracking-widest text-slate-400">
                                        {t("app.name", { defaultValue: "Your Store" })}
                                    </div>
                                    <div className="text-xl font-semibold text-[var(--brand-ink)]">
                                        {t("receipt.title", { defaultValue: "Receipt" })}
                                    </div>
                                </div>
                                <div
                                    className={
                                        "inline-flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full border " +
                                        statusTone(R.status)
                                    }
                                    aria-label={t("receipt.status", { defaultValue: "Status" })}
                                    title={t("receipt.status", { defaultValue: "Status" })}
                                >
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                                    {R.status}
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                                <div className="flex flex-col">
                  <span className="text-slate-400">
                    {t("receipt.order_no", { defaultValue: "Order No." })}
                  </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-900 font-mono">{R.orderNo}</span>
                                        <button
                                            onClick={handleCopy}
                                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-700 hover:bg-slate-50"
                                            title={t("common.copy", { defaultValue: "Copy" })}
                                        >
                                            {copied ? <ClipboardCheck size={12} /> : <Clipboard size={12} />}
                                            {copied
                                                ? t("common.copied", { defaultValue: "Copied" })
                                                : t("common.copy", { defaultValue: "Copy" })}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-slate-400">
                    {t("receipt.date", { defaultValue: "Date" })}
                  </span>
                                    <span className="text-slate-900 font-mono">{R.when}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        {Array.isArray(R.items) && R.items.length > 0 && (
                            <div className="px-5 py-4 border-b border-dashed border-slate-200">
                                <table className="w-full text-sm">
                                    <thead className="text-xs uppercase text-slate-400">
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-2 font-medium">
                                            {t("receipt.item", { defaultValue: "Item" })}
                                        </th>
                                        <th className="text-right py-2 font-medium">
                                            {t("receipt.qty", { defaultValue: "Qty" })}
                                        </th>
                                        <th className="text-right py-2 font-medium">
                                            {t("receipt.price", { defaultValue: "Unit Price" })} ({R.currency})
                                        </th>
                                        <th className="text-right py-2 font-medium">
                                            {t("receipt.total", { defaultValue: "Total" })} ({R.currency})
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="text-slate-800">
                                    {R.items.map((it, i) => (
                                        <tr key={i} className="border-b border-slate-50">
                                            <td className="py-2 pr-2">{it.name}</td>
                                            <td className="py-2 text-right font-mono">{it.qty}</td>
                                            <td className="py-2 text-right font-mono">
                                                {fmtMoney(it.unit, R.currency)}
                                            </td>
                                            <td className="py-2 text-right font-mono">
                                                {fmtMoney(it.lineTotal, R.currency)}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Totals */}
                        <div className="px-5 py-4 border-b border-dashed border-slate-200">
                            <div className="space-y-1 text-sm">
                                <Row
                                    label={t("receipt.subtotal", { defaultValue: "Subtotal" })}
                                    value={fmtMoney(R.subtotal, R.currency)}
                                    mono
                                />
                                <Row
                                    label={t("receipt.delivery_fee", { defaultValue: "Delivery Fee" })}
                                    value={fmtMoney(R.deliveryFee, R.currency)}
                                    mono
                                />
                                <div className="flex items-center justify-between gap-4 pt-2">
                  <span className="text-slate-900 font-semibold">
                    {t("receipt.total", { defaultValue: "Total" })}
                  </span>
                                    <span className="text-slate-900 font-semibold font-mono">
                    {fmtMoney(R.total, R.currency)}
                  </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer & Address */}
                        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-dashed border-slate-200">
                            <div>
                                <div className="text-sm font-semibold text-slate-900 mb-1">
                                    {t("receipt.customer", { defaultValue: "Customer" })}
                                </div>
                                <div className="text-sm text-slate-700 space-y-1">
                                    <div className="flex items-center justify-between gap-4 py-1">
                    <span className="text-slate-500 inline-flex items-center gap-1">
                      <User size={14} /> {t("receipt.name", { defaultValue: "Name" })}
                    </span>
                                        <span className="text-slate-800">{R.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1">
                    <span className="text-slate-500 inline-flex items-center gap-1">
                      <Phone size={14} /> {t("receipt.phone", { defaultValue: "Phone" })}
                    </span>
                                        <span className="text-slate-800">{R.phone}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 py-1">
                    <span className="text-slate-500 inline-flex items-center gap-1">
                      <Mail size={14} /> {t("receipt.email", { defaultValue: "Email" })}
                    </span>
                                        <span className="text-slate-800 break-all">{R.email}</span>
                                    </div>
                                    <Row
                                        label={t("receipt.payment_method", { defaultValue: "Payment Method" })}
                                        value={R.method}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-semibold text-slate-900 mb-1">
                                    {t("receipt.shipping_address", { defaultValue: "Shipping Address" })}
                                </div>
                                <div className="text-sm text-slate-700 space-y-1">
                                    <Row label={t("receipt.street", { defaultValue: "Street" })} value={R.addr.street} />
                                    <Row label={t("receipt.village", { defaultValue: "Village" })} value={R.addr.village} />
                                    <Row label={t("receipt.commune", { defaultValue: "Commune" })} value={R.addr.commune} />
                                    <Row label={t("receipt.district", { defaultValue: "District" })} value={R.addr.district} />
                                    <Row label={t("receipt.province", { defaultValue: "Province" })} value={R.addr.province} />
                                    {R.addr.gmaps !== "—" && (
                                        <div className="flex items-center justify-between gap-4 pt-1">
                      <span className="text-slate-500 inline-flex items-center gap-1">
                        <MapPin size={14} /> {t("receipt.map", { defaultValue: "Map" })}
                      </span>
                                            <a
                                                href={R.addr.gmaps}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sky-700 hover:underline"
                                            >
                                                {t("receipt.view_map", { defaultValue: "View location" })}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Thanks / footer */}
                        <div className="px-5 py-5">
                            <p className="text-center text-xs text-slate-500 tracking-wide">
                                {t("receipt.thanks", { defaultValue: "Thank you for your order!" })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 mb-2 print:hidden">
                    <div className="flex flex-col md:flex-row gap-2">
                        <button
                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
                            onClick={printReceipt}
                        >
                            <Printer size={16} />
                            {t("receipt.print", { defaultValue: "Print Receipt" })}
                        </button>
                        <button
                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
                            onClick={() => {
                                if (typeof onRestart === "function") onRestart();
                                navigate("/order");
                            }}
                        >
                            <RotateCcw size={16} />
                            {t("receipt.new_order", { defaultValue: "Start New Order" })}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
