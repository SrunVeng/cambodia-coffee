// src/pages/order/steps/Reciept.jsx
import { useEffect, useMemo, useState, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Download, RotateCcw } from "lucide-react";
import { normalizeReceipt, Ticket, getIdFromAny } from "../../../utils/myorderReciecpt.jsx";

export default function Receipt({ data, onRestart }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [receipt, setReceipt] = useState(data || null);

    // brand colors once
    useEffect(() => {
        const root = document.documentElement;
        if (!root.style.getPropertyValue("--brand-accent")) {
            root.style.setProperty("--brand-accent", "#a37b59");
        }
        if (!root.style.getPropertyValue("--brand-ink")) {
            root.style.setProperty("--brand-ink", "#0f172a");
        }
    }, []);

    // persist latest + dedupe list
    useEffect(() => {
        if (!receipt) return;
        try {
            localStorage.setItem("receipt", JSON.stringify(receipt));
            const id = getIdFromAny(receipt);
            const list = JSON.parse(localStorage.getItem("receipts") || "[]");
            const filtered = id ? list.filter((x) => getIdFromAny(x) !== id) : list;
            const next = [receipt, ...filtered].slice(0, 50);
            localStorage.setItem("receipts", JSON.stringify(next));
        } catch {}
    }, [receipt]);

    // header offset for sticky site headers
    const DEFAULT_HEADER_H = 64;
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

    // load from storage if not in props
    useEffect(() => {
        if (!receipt) {
            try {
                const raw = localStorage.getItem("receipt");
                if (raw) setReceipt(JSON.parse(raw));
            } catch {}
        }
    }, [receipt]);

    const R = useMemo(() => normalizeReceipt(receipt), [receipt]);

    if (!R) {
        return (
            <div className="text-sm text-center py-20">
                {t("receipt.missing", { defaultValue: "No receipt found." })}
            </div>
        );
    }

    const downloadPdf = () => window.print();

    return (
        <div className="w-full flex justify-center pb-24 bg-slate-50" style={{ paddingTop: topPad }}>
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
                    <Ticket R={R} t={t} withCopy />
                </div>

                {/* Actions (no print button) */}
                <div className="mt-6 mb-2 print:hidden">
                    <div className="flex flex-col md:flex-row gap-2">
                        <button
                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-900 shadow-sm"
                            onClick={downloadPdf}
                            title={t("myorder.download_pdf_tip", { defaultValue: "Use print → Save as PDF" })}
                        >
                            <Download size={16} />
                            {t("common.download", { defaultValue: "Download" })}
                        </button>
                        <button
                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 shadow-sm"
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
