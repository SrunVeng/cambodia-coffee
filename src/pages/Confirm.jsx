import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Stepper from "../components/order/Stepper.jsx";
import { LS_KEYS, readJSON, i18nSteps } from "../utils/ui";

export default function Confirm() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [receipt, setReceipt] = useState(null);

    useEffect(() => {
        setReceipt(readJSON(LS_KEYS.RECEIPT, null));
    }, []);

    const steps = useMemo(() => i18nSteps(t, 5), [t]);

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-4">
            {!!steps.length && (
                <div className="sticky top-16 sm:top-20 z-30">
                    <Stepper
                        steps={steps}
                        lang={i18n.language}
                        active={Math.max(steps.length - 1, 0)}     // "Receipt"
                        completed={steps.map((_, i) => i < steps.length - 1)}
                        maxReachable={steps.length - 1}
                        size="md"
                        showPartial={false}
                    />
                </div>
            )}

            {!receipt ? (
                <>
                    <div className="card p-4 rounded-2xl bg-[#fffaf3] border border-[#e7dbc9]">
                        <div className="font-semibold text-[#2d1a14] mb-2">
                            {t("review.no_items", { defaultValue: "No items." })}
                        </div>
                        <p className="text-sm text-[#6b5545]">
                            {t("review.no_address", { defaultValue: "—" })}
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate("/order")}>
                        {t("order.title", { defaultValue: "Checkout" })}
                    </button>
                </>
            ) : (
                <>
                    <div className="card p-4 rounded-2xl bg-[#fffaf3] border border-[#e7dbc9]">
                        <div className="font-semibold text-[#2d1a14] mb-2">
                            {steps?.[4]?.label || "Receipt"}
                        </div>
                        <div className="text-sm text-[#3b2a1d]/90 space-y-1">
                            <div>
                                ID: <span className="font-mono">{receipt.orderId || receipt.paymentId || "—"}</span>
                            </div>
                            <div>Status: {receipt.status || "—"}</div>
                            <div>Amount (USD): {receipt.amount ?? receipt.summary?.total ?? "—"}</div>
                            {receipt.summary?.original ? (
                                <div className="text-xs text-[#6b5545]">
                                    Original (KHR): subtotal {receipt.summary.original.subtotalKHR},
                                    {" "}delivery {receipt.summary.original.deliveryFeeKHR},
                                    {" "}total {receipt.summary.original.totalKHR}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button className="btn btn-primary" onClick={() => navigate("/order")}>
                            {t("products.addToCart", { defaultValue: "Add to Cart" })}
                        </button>
                        <button className="btn btn-ghost" onClick={() => navigate("/")}>
                            {t("common.back", { defaultValue: "Back" })}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
