import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function Receipt({ data, onRestart }) {
    const { t } = useTranslation();
    const [receipt, setReceipt] = useState(data || null);

    useEffect(() => {
        if (!receipt) {
            try {
                const raw = localStorage.getItem("receipt");
                if (raw) setReceipt(JSON.parse(raw));
            } catch {}
        }
    }, [receipt]);

    if (!receipt) {
        return (
            <div className="text-sm">
                {t("receipt.missing", { defaultValue: "No receipt found." })}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="card p-4 rounded-2xl border bg-[#fffaf3] border-[#e7dbc9]">
                <div className="font-semibold text-[#3b2a1d] mb-2">{t("receipt.title", { defaultValue: "Receipt" })}</div>
                <div className="text-sm text-[#3b2a1d]/90 space-y-1">
                    <div>{t("receipt.order_id", { defaultValue: "Order ID" })}: <span className="font-mono">{receipt.orderId || receipt.paymentId || "—"}</span></div>
                    <div>{t("receipt.status", { defaultValue: "Status" })}: {receipt.status || "—"}</div>
                    <div>{t("receipt.amount", { defaultValue: "Amount (USD)" })}: {receipt.amount ?? receipt.summary?.total ?? "—"}</div>
                </div>
            </div>

            <div className="flex gap-2">
                <button className="btn btn-primary" onClick={onRestart}>
                    {t("receipt.new_order", { defaultValue: "Start New Order" })}
                </button>
            </div>
        </div>
    );
}
