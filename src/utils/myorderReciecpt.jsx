// src/utils/myorderReciecpt.jsx
import { useState } from "react";
import { Clipboard, ClipboardCheck, MapPin, User, Phone, Mail } from "lucide-react";

/** ---------- Utils ---------- */
export const nonEmpty = (v) =>
    v !== undefined && v !== null && String(v).trim() !== "" ? v : "—";

export const formatDateTime = (val) => {
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

export const statusTone = (s) => {
    const v = String(s || "").toLowerCase();
    if (/(success|paid|complete|approved)/.test(v))
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (/(unpaid)/.test(v))
        return "bg-rose-50 text-rose-700 border-rose-200";
    if (/(pending|processing|created|initiated)/.test(v))
        return "bg-amber-50 text-amber-700 border-amber-200";
    if (/(fail|cancel|expired|error|declined)/.test(v))
        return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
};

// Java toString items fallback: [OrderRequestDto.Item(...), ...]
export const parseOrderItemsString = (s) => {
    if (typeof s !== "string" || s.trim() === "") return null;
    const out = [];
    const re = /OrderRequestDto\.Item\((.*?)\)/g;
    let m;
    while ((m = re.exec(s)) !== null) {
        const block = m[1];
        const name = /name=([^,)\]]+)/.exec(block)?.[1]?.trim();
        const qty = Number(/qty=([^,)\]]+)/.exec(block)?.[1]) || "—";
        const unit = /unitPrice=([^,)\]]+)/.exec(block)?.[1]?.trim() ?? "—";
        const lineTotal = /lineTotal=([^,)\]]+)/.exec(block)?.[1]?.trim() ?? "—";
        out.push({ name: nonEmpty(name), qty, unit, lineTotal });
    }
    return out.length ? out : null;
};

export const getIdFromAny = (r) => {
    let src = r;
    if (src?.data) src = src.data;
    if (src?.result) src = src.result;
    if (src?.receipt) src = src.receipt;
    if (src?.order) src = { ...src, ...src.order };
    return (
        src?.orderNo ||
        src?.orderId ||
        src?.paymentId ||
        src?.id ||
        src?.reference ||
        null
    );
};

export const fmtMoney = (v, currency) => {
    if (v === "—" || v === null || v === undefined) return "—";
    const n = Number(v);
    if (!Number.isFinite(n)) return String(v);
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: currency || "USD",
        }).format(n);
    } catch {
        return `${n.toFixed(2)} ${currency || ""}`.trim();
    }
};

// Normalize to a uniform shape usable by both screens
export function normalizeReceipt(raw) {
    if (!raw) return null;
    let src = raw;
    if (src?.data) src = src.data;
    if (src?.result) src = src.result;
    if (src?.receipt) src = src.receipt;
    if (src?.order) src = { ...src, ...src.order };

    const pickItems =
        src.items || src.orderItems || src.cart?.items || src.summary?.items || null;

    let items = null;
    const mapItem = (it, i) => {
        const name = it?.name ?? it?.title ?? it?.productName ?? `Item ${i + 1}`;
        const qty = it?.qty ?? it?.quantity ?? it?.count ?? 1;
        const unit = it?.unitPrice ?? it?.price ?? it?.amount ?? it?.unit_amount ?? null;
        const total =
            it?.lineTotal ?? it?.total ?? it?.subtotal ??
            (unit != null && qty != null ? Number(unit) * Number(qty) : null);
        return {
            name: nonEmpty(name),
            qty: Number.isFinite(Number(qty)) ? Number(qty) : nonEmpty(qty),
            unit: unit != null ? String(unit) : "—",
            lineTotal: total != null ? String(total) : "—",
        };
    };

    if (Array.isArray(pickItems)) {
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

    const when =
        src.orderDate || src.createdAt || src.submittedAt || src.timestamp || src.date;

    const currency = nonEmpty(src.currency || src.summary?.currency || "USD");

    return {
        _id: getIdFromAny(raw),
        orderNo: nonEmpty(
            src.orderNo || src.orderId || src.paymentId || src.id || src.reference
        ),
        status: nonEmpty(
            src.paymentStatus ||
            src.state ||
            src.orderStatus ||
            (typeof src.status === "string" ? src.status : null)
        ),
        method: nonEmpty(src.paymentMethod || src.method),
        currency,
        subtotal: nonEmpty(src.subtotal ?? src.summary?.subtotal),
        deliveryFee: nonEmpty(src.deliveryFee ?? src.summary?.deliveryFee),
        total: nonEmpty(src.total ?? src.amount ?? src.summary?.total),
        when: when ? formatDateTime(when) : "—",
        customer: {
            name: nonEmpty(src.name ?? src.customer?.name),
            phone: nonEmpty(src.phoneNumber ?? src.customer?.phone),
            email: nonEmpty(src.email ?? src.customer?.email),
        },
        address: {
            street: nonEmpty(src.street ?? src.address?.street),
            village: nonEmpty(src.village ?? src.address?.village),
            commune: nonEmpty(src.commune ?? src.address?.commune),
            district: nonEmpty(src.district ?? src.address?.district),
            province: nonEmpty(src.province ?? src.address?.province),
            gmaps: nonEmpty(
                src.gmaps_search ?? src.address?.gmaps_search ?? src.address?.gmapsSearch
            ),
        },
        items,
        _raw: raw,
    };
}

/** Small helper: map raw method to label (needs i18n) */
function formatMethodLabel(raw, t) {
    const key = String(raw || "").toLowerCase();
    if (key === "cod")
        return t?.("receipt.method.cod", { defaultValue: "Cash on Delivery" }) || "Cash on Delivery";
    if (key === "aba")
        return t?.("receipt.method.aba", { defaultValue: "ABA Pay" }) || "ABA Pay";
    return raw || "—";
}

/** ---------- Shared Ticket (presentational) ---------- */
export function Ticket({ R, t, withCopy = true }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard?.writeText?.(R.orderNo || "");
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {}
    };

    const Row = ({ label, value, mono }) => (
        <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-slate-500">{label}</span>
            <span className={["text-slate-800", mono ? "font-mono" : ""].join(" ")}>
        {value}
      </span>
        </div>
    );

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
            <div
                className="h-1.5"
                style={{
                    background:
                        "linear-gradient(90deg, var(--brand-accent,#a37b59), color-mix(in oklab, var(--brand-accent,#a37b59) 70%, white))",
                }}
            />

            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-dashed border-slate-200">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-xs uppercase tracking-widest text-slate-400">
                            {t?.("app.name", { defaultValue: "Your Store" }) || "Your Store"}
                        </div>
                        <div className="text-xl font-semibold text-[var(--brand-ink,#0f172a)]">
                            {t?.("receipt.title", { defaultValue: "Receipt" }) || "Receipt"}
                        </div>
                    </div>
                    <div
                        className={
                            "inline-flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full border " +
                            statusTone(R.status)
                        }
                        aria-label={t?.("receipt.status", { defaultValue: "Status" }) || "Status"}
                    >
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {R.status}
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                    <div className="flex flex-col">
            <span className="text-slate-400">
              {t?.("receipt.order_no", { defaultValue: "Order No." }) || "Order No."}
            </span>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-900 font-mono break-all">{R.orderNo}</span>
                            {withCopy && (
                                <button
                                    onClick={handleCopy}
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-700 hover:bg-slate-50"
                                    title={t?.("common.copy", { defaultValue: "Copy" }) || "Copy"}
                                >
                                    {copied ? <ClipboardCheck size={12} /> : <Clipboard size={12} />}
                                    {copied
                                        ? t?.("common.copied", { defaultValue: "Copied" }) || "Copied"
                                        : t?.("common.copy", { defaultValue: "Copy" }) || "Copy"}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end">
            <span className="text-slate-400">
              {t?.("receipt.date", { defaultValue: "Date" }) || "Date"}
            </span>
                        <span className="text-slate-900 font-mono">{R.when}</span>
                    </div>
                </div>
            </div>

            {/* Items */}
            {Array.isArray(R.items) && R.items.length > 0 && (
                <div className="px-5 py-4 border-b border-dashed border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase text-slate-400">
                            <tr className="border-b border-slate-100">
                                <th className="text-left py-2 font-medium">
                                    {t?.("receipt.item", { defaultValue: "Item" }) || "Item"}
                                </th>
                                <th className="text-right py-2 font-medium">
                                    {t?.("receipt.qty", { defaultValue: "Qty" }) || "Qty"}
                                </th>
                                <th className="text-right py-2 font-medium">
                                    {(t?.("receipt.price", { defaultValue: "Unit Price" }) || "Unit Price") +
                                        ` (${R.currency})`}
                                </th>
                                <th className="text-right py-2 font-medium">
                                    {(t?.("receipt.total", { defaultValue: "Total" }) || "Total") +
                                        ` (${R.currency})`}
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
                </div>
            )}

            {/* Totals */}
            <div className="px-5 py-4 border-b border-dashed border-slate-200">
                <div className="space-y-1 text-sm">
                    <Row
                        label={t?.("receipt.subtotal", { defaultValue: "Subtotal" }) || "Subtotal"}
                        value={fmtMoney(R.subtotal, R.currency)}
                        mono
                    />
                    <Row
                        label={
                            t?.("receipt.delivery_fee", { defaultValue: "Delivery Fee" }) ||
                            "Delivery Fee"
                        }
                        value={fmtMoney(R.deliveryFee, R.currency)}
                        mono
                    />
                    <div className="flex items-center justify-between gap-4 pt-2">
            <span className="text-slate-900 font-semibold">
              {t?.("receipt.total", { defaultValue: "Total" }) || "Total"}
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
                        {t?.("receipt.customer", { defaultValue: "Customer" }) || "Customer"}
                    </div>
                    <div className="text-sm text-slate-700 space-y-1">
                        <div className="flex items-center justify-between gap-4 py-1">
              <span className="text-slate-500 inline-flex items-center gap-1">
                <User size={14} />{" "}
                  {t?.("receipt.name", { defaultValue: "Name" }) || "Name"}
              </span>
                            <span className="text-slate-800">{R.customer?.name || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 py-1">
              <span className="text-slate-500 inline-flex items-center gap-1">
                <Phone size={14} />{" "}
                  {t?.("receipt.phone", { defaultValue: "Phone" }) || "Phone"}
              </span>
                            <span className="text-slate-800">{R.customer?.phone || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 py-1">
              <span className="text-slate-500 inline-flex items-center gap-1">
                <Mail size={14} />{" "}
                  {t?.("receipt.email", { defaultValue: "Email" }) || "Email"}
              </span>
                            <span className="text-slate-800 break-all">{R.customer?.email || "—"}</span>
                        </div>
                        <Row
                            label={t?.("receipt.payment_method", { defaultValue: "Payment Method" }) || "Payment Method"}
                            value={formatMethodLabel(R.method, t)}
                        />
                    </div>
                </div>

                <div>
                    <div className="text-sm font-semibold text-slate-900 mb-1">
                        {t?.("receipt.shipping_address", { defaultValue: "Shipping Address" }) ||
                            "Shipping Address"}
                    </div>
                    <div className="text-sm text-slate-700 space-y-1">
                        <Row
                            label={t?.("receipt.street", { defaultValue: "Street" }) || "Street"}
                            value={R.address?.street || "—"}
                        />
                        <Row
                            label={t?.("receipt.village", { defaultValue: "Village" }) || "Village"}
                            value={R.address?.village || "—"}
                        />
                        <Row
                            label={t?.("receipt.commune", { defaultValue: "Commune" }) || "Commune"}
                            value={R.address?.commune || "—"}
                        />
                        <Row
                            label={t?.("receipt.district", { defaultValue: "District" }) || "District"}
                            value={R.address?.district || "—"}
                        />
                        <Row
                            label={t?.("receipt.province", { defaultValue: "Province" }) || "Province"}
                            value={R.address?.province || "—"}
                        />
                        {R.address?.gmaps && R.address?.gmaps !== "—" && (
                            <div className="flex items-center justify-between gap-4 pt-1">
                <span className="text-slate-500 inline-flex items-center gap-1">
                  <MapPin size={14} />{" "}
                    {t?.("receipt.map", { defaultValue: "Map" }) || "Map"}
                </span>
                                <a
                                    href={R.address.gmaps}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sky-700 hover:underline"
                                >
                                    {t?.("receipt.view_map", { defaultValue: "View location" }) ||
                                        "View location"}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-5">
                <p className="text-center text-xs text-slate-500 tracking-wide">
                    {t?.("receipt.thanks", { defaultValue: "Thank you for your order!" }) ||
                        "Thank you for your order!"}
                </p>
            </div>
        </div>
    );
}
