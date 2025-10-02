// src/pages/myorder/MyOrder.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { X, Download, Trash2 } from "lucide-react";
import {
    normalizeReceipt,
    getIdFromAny,
    Ticket,
    statusTone,
    fmtMoney,
} from "../utils/myorderReciecpt.jsx";

export default function MyOrder() {
    const { t } = useTranslation();

    const [latestRaw, setLatestRaw] = useState(null);
    const [listRaw, setListRaw] = useState([]);
    const [modalId, setModalId] = useState(null);
    const [printTarget, setPrintTarget] = useState(null);

    const reload = useCallback(() => {
        try {
            const v = localStorage.getItem("receipt");
            if (v) setLatestRaw(JSON.parse(v));
            else setLatestRaw(null);
        } catch { setLatestRaw(null); }
        try {
            const L = JSON.parse(localStorage.getItem("receipts") || "[]");
            setListRaw(Array.isArray(L) ? L : []);
        } catch {
            setListRaw([]);
        }
    }, []);

    useEffect(() => {
        reload();
        const onStorage = (e) => {
            if (e.key === "receipt" || e.key === "receipts") reload();
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [reload]);

    const latest = useMemo(() => normalizeReceipt(latestRaw), [latestRaw]);
    const receipts = useMemo(
        () => listRaw.map((r) => normalizeReceipt(r)).filter(Boolean),
        [listRaw]
    );

    const removeById = useCallback((id) => {
        const next = receipts.filter((r) => r._id !== id).map((r) => r._raw);
        localStorage.setItem("receipts", JSON.stringify(next));
        if (latest && latest._id === id) {
            localStorage.removeItem("receipt");
            setLatestRaw(null);
        }
        setListRaw(next);
        if (modalId === id) setModalId(null);
    }, [receipts, latest, modalId]);

    const openModal = useCallback((id) => setModalId(id), []);
    const closeModal = useCallback(() => setModalId(null), []);
    const modalReceipt =
        receipts.find((r) => r._id === modalId) ||
        (latest && latest._id === modalId ? latest : null);

    // Close on ESC
    useEffect(() => {
        if (!modalReceipt) return;
        const onKey = (e) => { if (e.key === "Escape") closeModal(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [modalReceipt, closeModal]);

    const downloadAsPdf = useCallback((R) => {
        setPrintTarget(R);
        setTimeout(() => {
            window.print(); // user can "Save as PDF"
            setTimeout(() => setPrintTarget(null), 200);
        }, 50);
    }, []);

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

            {/* Hidden print target */}
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
                        <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-ink,#0f172a)]">
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
                                    <div className="font-mono text-slate-900 break-all">{latest.orderNo}</div>
                                    <div className="text-xs text-slate-500">
                                        {t("myorder.date", { defaultValue: "Date" })}:{" "}
                                        <span className="font-mono">{latest.when}</span>
                                    </div>
                                </div>
                                <div className={"text-xs font-medium px-2 py-1 rounded border " + statusTone(latest.status)}>
                                    {latest.status}
                                </div>
                            </div>
                        </div>

                        {Array.isArray(latest.items) && latest.items.length > 0 && (
                            <div className="p-5 border-b border-dashed border-slate-200">
                                <div className="text-sm font-semibold mb-2">
                                    {t("myorder.items", { defaultValue: "Items" })}
                                </div>
                                <ul className="text-sm text-slate-800 divide-y divide-slate-100">
                                    {latest.items.slice(0, 4).map((it, i) => (
                                        <li key={i} className="py-2 flex items-center justify-between">
                                            <span className="truncate">{it.name}</span>
                                            <span className="font-mono text-slate-700">
                        {it.qty} × {fmtMoney(it.unit, latest.currency)} = {fmtMoney(it.lineTotal, latest.currency)}
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
                                    <span className="font-mono">{fmtMoney(latest.subtotal, latest.currency)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    {t("receipt.delivery_fee", { defaultValue: "Delivery Fee" })} ({latest.currency})
                  </span>
                                    <span className="font-mono">{fmtMoney(latest.deliveryFee, latest.currency)}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                  <span className="font-semibold">
                    {t("receipt.total", { defaultValue: "Total" })} ({latest.currency})
                  </span>
                                    <span className="font-semibold font-mono">{fmtMoney(latest.total, latest.currency)}</span>
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
                                    onClick={() => downloadAsPdf(latest)}
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                                    title={t("myorder.download_pdf_tip", { defaultValue: "Use print → Save as PDF" })}
                                >
                                    <Download size={16} /> {t("common.download", { defaultValue: "Download" })}
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
                        <span className="text-xs text-slate-500">
              {receipts.length} {t("myorder.count", { defaultValue: "saved" })}
            </span>
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
                                        if (e.target.closest?.("button")) return;
                                        openModal(r._id);
                                    }}
                                >
                                    <div className="grid md:grid-cols-12 gap-2 md:gap-3 items-center">
                                        <div className="md:col-span-3">
                                            <div className="font-mono text-sm break-all">{r.orderNo}</div>
                                            <div className="md:hidden text-xs text-slate-500 mt-0.5">{r.when}</div>
                                        </div>
                                        <div className="hidden md:block md:col-span-2 text-sm">{r.when}</div>
                                        <div className="md:col-span-2 text-sm">
                                            <span className="font-mono">{fmtMoney(r.total, r.currency)}</span>
                                        </div>
                                        <div className="md:col-span-2">
                      <span className={"inline-block text-xs px-2 py-1 rounded border " + statusTone(r.status)}>
                        {r.status}
                      </span>
                                        </div>
                                        <div className="md:col-span-3">
                                            <div className="flex md:justify-end gap-2">
                                                <button
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 text-xs"
                                                    onClick={(e) => { e.stopPropagation(); downloadAsPdf(r); }}
                                                    title={t("myorder.download_pdf_tip", { defaultValue: "Use print → Save as PDF" })}
                                                >
                                                    <Download size={14} /> {t("common.download", { defaultValue: "Download" })}
                                                </button>
                                                <button
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 text-xs"
                                                    onClick={(e) => { e.stopPropagation(); removeById(r._id); }}
                                                >
                                                    <Trash2 size={14} /> {t("common.delete", { defaultValue: "Delete" })}
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

            {/* Modal: full-screen mobile, clear Close, non-cut content */}
            {modalReceipt && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="receipt-modal-title"
                    onClick={closeModal}
                >
                    {/* overlay */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                    {/* dialog */}
                    <div
                        className="
        relative z-10 w-full max-w-lg
        max-h-[92vh] sm:max-h-[90vh]
        rounded-2xl bg-white shadow-2xl
        flex flex-col overflow-hidden
      "
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* header stays visible */}
                        <div className="bg-white/95 backdrop-blur border-b border-slate-200 px-3 sm:px-4 py-3 flex items-center justify-between">
                            <div id="receipt-modal-title" className="text-sm font-medium">
                                {t("receipt.title", { defaultValue: "Receipt" })}
                            </div>
                            <button
                                onClick={closeModal}
                                className="inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100"
                                aria-label={t("common.close", { defaultValue: "Close" })}
                                title={t("common.close", { defaultValue: "Close" })}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* SCROLL AREA — this is the important part */}
                        <div
                            className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4"
                            style={{ WebkitOverflowScrolling: "touch" }} // smooth iOS scrolling
                        >
                            <Ticket R={modalReceipt} t={t} />
                        </div>

                        {/* footer stays visible */}
                        <div className="bg-white/95 backdrop-blur px-3 sm:px-4 py-3 border-t border-slate-200 flex gap-2 justify-end">
                            <button
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-sm"
                                onClick={() => downloadAsPdf(modalReceipt)}
                                title={t("myorder.download_pdf_tip", { defaultValue: "Use print → Save as PDF" })}
                            >
                                <Download size={16} /> {t("common.download", { defaultValue: "Download" })}
                            </button>
                            <button
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 text-sm"
                                onClick={() => removeById(modalReceipt._id)}
                            >
                                <Trash2 size={16} /> {t("common.delete", { defaultValue: "Delete" })}
                            </button>
                            <button
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm"
                                onClick={closeModal}
                            >
                                <X size={16} /> {t("common.close", { defaultValue: "Close" })}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
