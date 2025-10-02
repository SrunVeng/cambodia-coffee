import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

/** ---------- Utils ---------- */
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

// Java toString items fallback
const parseOrderItemsString = (s) => {
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

const getIdFromAny = (r) => {
    let src = r;
    if (src?.data) src = src.data;
    if (src?.result) src = src.result;
    if (src?.receipt) src = src.receipt;
    if (src?.order) src = { ...src, ...src.order };
    return src?.orderNo || src?.orderId || src?.paymentId || src?.id || src?.reference || null;
};

// Normalize to a uniform shape
function normalizeReceipt(raw) {
    if (!raw) return null;
    let src = raw;
    if (src?.data) src = src.data;
    if (src?.result) src = src.result;
    if (src?.receipt) src = src.receipt;
    if (src?.order) src = { ...src, ...src.order };

    const pickItems = src.items || src.orderItems || src.cart?.items || src.summary?.items || null;
    let items = null;

    if (Array.isArray(pickItems)) {
        items = pickItems.map((it, i) => ({
            name: nonEmpty(it?.name ?? it?.title ?? it?.productName ?? `Item ${i + 1}`),
            qty: Number.isFinite(Number(it?.qty ?? it?.quantity ?? it?.count))
                ? Number(it?.qty ?? it?.quantity ?? it?.count)
                : nonEmpty(it?.qty ?? it?.quantity ?? it?.count),
            unit: String(it?.unitPrice ?? it?.price ?? it?.amount ?? it?.unit_amount ?? "—"),
            lineTotal: String(
                it?.lineTotal ??
                it?.total ??
                it?.subtotal ??
                (it?.unitPrice != null && it?.qty != null ? Number(it.unitPrice) * Number(it.qty) : "—")
            ),
        }));
    } else if (typeof pickItems === "string") {
        let parsed = null;
        try { parsed = JSON.parse(pickItems); } catch {}
        if (Array.isArray(parsed) && parsed.length) {
            items = parsed.map((it, i) => ({
                name: nonEmpty(it?.name ?? it?.title ?? it?.productName ?? `Item ${i + 1}`),
                qty: Number.isFinite(Number(it?.qty ?? it?.quantity ?? it?.count))
                    ? Number(it?.qty ?? it?.quantity ?? it?.count)
                    : nonEmpty(it?.qty ?? it?.quantity ?? it?.count),
                unit: String(it?.unitPrice ?? it?.price ?? it?.amount ?? it?.unit_amount ?? "—"),
                lineTotal: String(
                    it?.lineTotal ??
                    it?.total ??
                    it?.subtotal ??
                    (it?.unitPrice != null && it?.qty != null ? Number(it.unitPrice) * Number(it.qty) : "—")
                ),
            }));
        } else {
            items = parseOrderItemsString(pickItems);
        }
    }

    const when =
        src.orderDate || src.createdAt || src.submittedAt || src.timestamp || src.date;

    const currency = nonEmpty(src.currency || src.summary?.currency || "USD");

    return {
        _id: getIdFromAny(raw),
        orderNo: nonEmpty(src.orderNo || src.orderId || src.paymentId || src.id || src.reference),
        status:
            nonEmpty(
                src.paymentStatus || src.state || src.orderStatus || (typeof src.status === "string" ? src.status : null)
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
            gmaps: nonEmpty(src.gmaps_search ?? src.address?.gmaps_search ?? src.address?.gmapsSearch),
        },
        items,
        _raw: raw,
    };
}

/** ---------- Ticket (for modal & print) ---------- */
function Ticket({ R, t }) {
    const Row = ({ label, value, mono }) => (
        <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-slate-500">{label}</span>
            <span className={["text-slate-800", mono ? "font-mono" : ""].join(" ")}>{value}</span>
        </div>
    );
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
            <div className="h-1.5" style={{ background: "var(--brand-accent, #a37b59)" }} />
            <div className="px-5 pt-5 pb-3 border-b border-dashed border-slate-200">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-xs uppercase tracking-widest text-slate-400">
                            {t("app.name", { defaultValue: "Your Store" })}
                        </div>
                        <div className="text-xl font-semibold text-slate-900">
                            {t("receipt.title", { defaultValue: "Receipt" })}
                        </div>
                    </div>
                    <div className={"text-xs font-medium px-2 py-1 rounded border " + statusTone(R.status)}>
                        {R.status}
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs font-mono text-slate-700">
                    <div className="flex flex-col">
                        <span className="text-slate-400">{t("receipt.order_no", { defaultValue: "Order No." })}</span>
                        <span className="text-slate-900">{R.orderNo}</span>
                    </div>
                    <div className="flex flex-col items-start md:items-end">
                        <span className="text-slate-400">{t("receipt.date", { defaultValue: "Date" })}</span>
                        <span className="text-slate-900">{R.when}</span>
                    </div>
                </div>
            </div>

            {Array.isArray(R.items) && R.items.length > 0 && (
                <div className="px-5 py-4 border-b border-dashed border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase text-slate-400">
                        <tr className="border-b border-slate-100">
                            <th className="text-left py-2 font-medium">{t("receipt.item", { defaultValue: "Item" })}</th>
                            <th className="text-right py-2 font-medium">{t("receipt.qty", { defaultValue: "Qty" })}</th>
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
                                <td className="py-2 text-right font-mono">{it.unit}</td>
                                <td className="py-2 text-right font-mono">{it.lineTotal}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="px-5 py-4 border-b border-dashed border-slate-200">
                <div className="space-y-1 text-sm">
                    <Row
                        label={t("receipt.subtotal", { defaultValue: "Subtotal" }) + ` (${R.currency})`}
                        value={R.subtotal}
                        mono
                    />
                    <Row
                        label={t("receipt.delivery_fee", { defaultValue: "Delivery Fee" }) + ` (${R.currency})`}
                        value={R.deliveryFee}
                        mono
                    />
                    <div className="flex items-center justify-between gap-4 pt-2">
            <span className="text-slate-900 font-semibold">
              {t("receipt.total", { defaultValue: "Total" })} ({R.currency})
            </span>
                        <span className="text-slate-900 font-semibold font-mono">{R.total}</span>
                    </div>
                </div>
            </div>

            <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-dashed border-slate-200">
                <div>
                    <div className="text-sm font-semibold text-slate-900 mb-1">
                        {t("receipt.customer", { defaultValue: "Customer" })}
                    </div>
                    <div className="text-sm text-slate-700 space-y-1">
                        <Row label={t("receipt.name", { defaultValue: "Name" })} value={R.customer?.name || "—"} />
                        <Row label={t("receipt.phone", { defaultValue: "Phone" })} value={R.customer?.phone || "—"} />
                        <Row label={t("receipt.email", { defaultValue: "Email" })} value={R.customer?.email || "—"} />
                        <Row label={t("receipt.payment_method", { defaultValue: "Payment Method" })} value={R.method || "—"} />
                    </div>
                </div>

                <div>
                    <div className="text-sm font-semibold text-slate-900 mb-1">
                        {t("receipt.shipping_address", { defaultValue: "Shipping Address" })}
                    </div>
                    <div className="text-sm text-slate-700 space-y-1">
                        <Row label={t("receipt.street", { defaultValue: "Street" })} value={R.address?.street || "—"} />
                        <Row label={t("receipt.village", { defaultValue: "Village" })} value={R.address?.village || "—"} />
                        <Row label={t("receipt.commune", { defaultValue: "Commune" })} value={R.address?.commune || "—"} />
                        <Row label={t("receipt.district", { defaultValue: "District" })} value={R.address?.district || "—"} />
                        <Row label={t("receipt.province", { defaultValue: "Province" })} value={R.address?.province || "—"} />
                    </div>
                </div>
            </div>

            <div className="px-5 py-5">
                <p className="text-center text-xs text-slate-500 tracking-wide">
                    {t("receipt.thanks", { defaultValue: "Thank you for your order!" })}
                </p>
            </div>
        </div>
    );
}

/** ---------- Page ---------- */
export default function MyOrder() {
    const { t } = useTranslation();

    // latest
    const [latestRaw, setLatestRaw] = useState(null);
    // list
    const [listRaw, setListRaw] = useState([]);
    // modal
    const [modalId, setModalId] = useState(null);
    // print target
    const [printTarget, setPrintTarget] = useState(null);

    // load from localStorage
    const reload = useCallback(() => {
        try {
            const v = localStorage.getItem("receipt");
            if (v) setLatestRaw(JSON.parse(v));
        } catch {}
        try {
            const L = JSON.parse(localStorage.getItem("receipts") || "[]");
            setListRaw(Array.isArray(L) ? L : []);
        } catch { setListRaw([]); }
    }, []);

    useEffect(() => {
        reload();
        const onStorage = (e) => {
            if (e.key === "receipt" || e.key === "receipts") reload();
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [reload]);

    // normalize
    const latest = useMemo(() => normalizeReceipt(latestRaw), [latestRaw]);
    const receipts = useMemo(
        () => listRaw.map((r) => normalizeReceipt(r)).filter(Boolean),
        [listRaw]
    );

    // delete
    const removeById = (id) => {
        const next = receipts.filter((r) => r._id !== id).map((r) => r._raw);
        localStorage.setItem("receipts", JSON.stringify(next));
        // if latest is the same, also clear latest
        if (latest && latest._id === id) {
            localStorage.removeItem("receipt");
            setLatestRaw(null);
        }
        setListRaw(next);
    };

    // open/close modal
    const openModal = (id) => setModalId(id);
    const closeModal = () => setModalId(null);
    const modalReceipt = receipts.find((r) => r._id === modalId) || (latest && latest._id === modalId ? latest : null);

    // print/download specific
    const printSpecific = (R) => {
        setPrintTarget(R);
        // wait a tick for hidden print DOM to render
        setTimeout(() => {
            window.print();
            // clear after print completes (a small delay avoids flicker)
            setTimeout(() => setPrintTarget(null), 200);
        }, 50);
    };

    // empty state
    if (!latest && receipts.length === 0) {
        return (
            <div className="container-narrow pt-24 pb-16">
                <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                    <div className="text-xl font-semibold text-slate-900 mb-2">
                        {t("myorder.empty_title", { defaultValue: "You don’t have any orders yet" })}
                    </div>
                    <p className="text-slate-600 mb-6">
                        {t("myorder.empty_desc", { defaultValue: "Start your first order now." })}
                    </p>
                    <Link
                        to="/order"
                        className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                    >
                        {t("myorder.start_order", { defaultValue: "Make an Order" })}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container-narrow pt-24 pb-16">
            {/* Print-only CSS for targeted printing */}
            <style>{`
        @media print {
          @page { margin: 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden !important; }
          .print-area-target, .print-area-target * { visibility: visible !important; }
          .print-area-target { position: absolute !important; left: 0; top: 0; width: 100% !important; }
          .no-print { display: none !important; }
        }
      `}</style>

            {/* Hidden print target (renders selected receipt only) */}
            {printTarget && (
                <div className="print-area-target">
                    <div className="max-w-md mx-auto">
                        <Ticket R={printTarget} t={t} />
                    </div>
                </div>
            )}

            {/* Latest */}
            {latest && (
                <div className="max-w-2xl mx-auto mb-10">
                    <div className="mb-4">
                        <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-ink)]">
                            {t("myorder.title", { defaultValue: "My Order" })}
                        </h1>
                        <p className="text-slate-600 text-sm">
                            {t("myorder.subtitle", { defaultValue: "Your most recent order" })}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="h-1.5" style={{ background: "var(--brand-accent, #a37b59)" }} />
                        <div className="p-5 border-b border-dashed border-slate-200">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="text-xs uppercase tracking-widest text-slate-400">
                                        {t("myorder.order_no", { defaultValue: "Order No." })}
                                    </div>
                                    <div className="font-mono text-slate-900">{latest.orderNo}</div>
                                    <div className="text-xs text-slate-500">
                                        {t("myorder.date", { defaultValue: "Date" })}: <span className="font-mono">{latest.when}</span>
                                    </div>
                                </div>
                                <div className={"text-xs font-medium px-2 py-1 rounded border " + statusTone(latest.status)}>
                                    {latest.status}
                                </div>
                            </div>
                        </div>

                        {Array.isArray(latest.items) && latest.items.length > 0 && (
                            <div className="p-5 border-b border-dashed border-slate-200">
                                <div className="text-sm font-semibold mb-2">{t("myorder.items", { defaultValue: "Items" })}</div>
                                <ul className="text-sm text-slate-800 divide-y divide-slate-100">
                                    {latest.items.slice(0, 4).map((it, i) => (
                                        <li key={i} className="py-2 flex items-center justify-between">
                                            <span className="truncate">{it.name}</span>
                                            <span className="font-mono text-slate-700">
                        {it.qty} × {it.unit} = {it.lineTotal} {latest.currency}
                      </span>
                                        </li>
                                    ))}
                                </ul>
                                {latest.items.length > 4 && (
                                    <div className="text-xs text-slate-500 mt-2">
                                        + {latest.items.length - 4} {t("myorder.more", { defaultValue: "more item(s)" })}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="p-5">
                            <div className="text-sm space-y-1">
                                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    {t("receipt.subtotal", { defaultValue: "Subtotal" })} ({latest.currency})
                  </span>
                                    <span className="font-mono">{latest.subtotal}</span>
                                </div>
                                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    {t("receipt.delivery_fee", { defaultValue: "Delivery Fee" })} ({latest.currency})
                  </span>
                                    <span className="font-mono">{latest.deliveryFee}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                  <span className="font-semibold">
                    {t("receipt.total", { defaultValue: "Total" })} ({latest.currency})
                  </span>
                                    <span className="font-semibold font-mono">{latest.total}</span>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={() => openModal(latest._id)}
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-sm"
                                >
                                    {t("myorder.view_receipt", { defaultValue: "View Receipt" })}
                                </button>
                                <button
                                    onClick={() => printSpecific(latest)}
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                                >
                                    {t("myorder.download_pdf", { defaultValue: "Download (PDF)" })}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* All receipts list */}
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">
                        {t("myorder.all", { defaultValue: "All Receipts" })}
                    </h2>
                    {receipts.length > 0 && (
                        <span className="text-xs text-slate-500">{receipts.length} {t("myorder.count", { defaultValue: "saved" })}</span>
                    )}
                </div>

                {receipts.length === 0 ? (
                    <div className="text-sm text-slate-600">
                        {t("myorder.none", { defaultValue: "No saved receipts yet." })}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                            <div className="col-span-3">{t("myorder.order_no", { defaultValue: "Order No." })}</div>
                            <div className="col-span-2">{t("myorder.date", { defaultValue: "Date" })}</div>
                            <div className="col-span-2">{t("receipt.total", { defaultValue: "Total" })}</div>
                            <div className="col-span-2">{t("receipt.status", { defaultValue: "Status" })}</div>
                            <div className="col-span-3 text-right">{t("common.actions", { defaultValue: "Actions" })}</div>
                        </div>

                        <ul className="divide-y divide-slate-100">
                            {receipts.map((r) => (
                                <li
                                    key={r._id || r.orderNo}
                                    className="px-4 py-3 hover:bg-slate-50 transition cursor-pointer"
                                    onClick={(e) => {
                                        // avoid row click when clicking actions
                                        if ((e.target).closest?.("button")) return;
                                        openModal(r._id);
                                    }}
                                >
                                    <div className="grid md:grid-cols-12 gap-2 md:gap-3 items-center">
                                        <div className="md:col-span-3">
                                            <div className="font-mono text-sm">{r.orderNo}</div>
                                            <div className="md:hidden text-xs text-slate-500 mt-0.5">{r.when}</div>
                                        </div>
                                        <div className="hidden md:block md:col-span-2 text-sm">{r.when}</div>
                                        <div className="md:col-span-2 text-sm">
                                            <span className="font-mono">{r.total}</span> {r.currency}
                                        </div>
                                        <div className="md:col-span-2">
                      <span className={"inline-block text-xs px-2 py-1 rounded border " + statusTone(r.status)}>
                        {r.status}
                      </span>
                                        </div>
                                        <div className="md:col-span-3">
                                            <div className="flex md:justify-end gap-2">
                                                <button
                                                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 text-xs"
                                                    onClick={(e) => { e.stopPropagation(); printSpecific(r); }}
                                                >
                                                    {t("common.print", { defaultValue: "Print" })}
                                                </button>
                                                <button
                                                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 text-xs"
                                                    title={t("myorder.download_pdf_tip", { defaultValue: "Uses the print dialog → Save as PDF" })}
                                                    onClick={(e) => { e.stopPropagation(); printSpecific(r); }}
                                                >
                                                    {t("common.download", { defaultValue: "Download" })}
                                                </button>
                                                <button
                                                    className="px-3 py-1.5 rounded-lg border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 text-xs"
                                                    onClick={(e) => { e.stopPropagation(); removeById(r._id); }}
                                                >
                                                    {t("common.delete", { defaultValue: "Delete" })}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalReceipt && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={closeModal}
                >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div
                        className="relative z-10 w-full max-w-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="rounded-2xl overflow-hidden shadow-2xl">
                            <Ticket R={modalReceipt} t={t} />
                        </div>

                        <div className="mt-3 flex gap-2 justify-end">
                            <button
                                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-sm"
                                onClick={() => printSpecific(modalReceipt)}
                            >
                                {t("common.print", { defaultValue: "Print" })}
                            </button>
                            <button
                                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                                onClick={() => printSpecific(modalReceipt)}
                                title={t("myorder.download_pdf_tip", { defaultValue: "Uses the print dialog → Save as PDF" })}
                            >
                                {t("common.download", { defaultValue: "Download" })}
                            </button>
                            <button
                                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-sm"
                                onClick={closeModal}
                            >
                                {t("common.close", { defaultValue: "Close" })}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
