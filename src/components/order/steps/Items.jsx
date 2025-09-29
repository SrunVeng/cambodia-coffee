// src/pages/order/steps/Items.jsx
import { useMemo, useState } from "react";
import { useCart } from "../../../store/cart";
import { fmt } from "../../../utils/currency";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

import ProductPicker from "../../../components/ProductPicker.jsx";
import Line from "../../../components/Line";
import LeaveGuard from "../../ui/LeaveGuard.jsx";

export default function Items({ currency = "KHR", deliveryFee = 0, onNext, onBack }) {
    const { t } = useTranslation();

    const items = useCart((s) => s.items);
    const subtotal = useCart((s) => s.subtotal());
    const replace = useCart((s) => s.replace);
    const add = useCart((s) => s.add);
    const remove = useCart((s) => s.remove);
    const increment = useCart((s) => s.increment);
    const decrement = useCart((s) => s.decrement);

    const [pickerOpen, setPickerOpen] = useState(false);
    const [clearOpen, setClearOpen] = useState(false);

    const total = useMemo(
        () => (subtotal || 0) + (deliveryFee || 0),
        [subtotal, deliveryFee]
    );

    const handleInc = (it) => increment({ id: it.id, variantId: it.variantId });
    const handleDec = (it) => decrement({ id: it.id, variantId: it.variantId });
    const handleRemove = (it) => remove({ id: it.id, variantId: it.variantId });

    function goNext() {
        // ✅ Let the Wizard recompute & persist summary (single source of truth)
        onNext?.({ currency, items, subtotal, deliveryFee, total });
    }

    return (
        <div className="space-y-4">
            {/* Header / Actions */}
            <div className="rounded-2xl border border-[#e7dbc9] bg-[#fffaf3] shadow-sm p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="font-semibold text-base sm:text-lg text-[#2d1a14]">
                        {t("items.title", { defaultValue: "Your Cart" })}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="
                inline-flex items-center gap-2 rounded-lg border border-[#c9a44c]
                px-3 py-2 text-sm font-medium text-[#2d1a14]
                hover:shadow-sm hover:ring-1 hover:ring-[#c9a44c]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44c] focus-visible:ring-offset-2
                bg-white/60
              "
                            onClick={() => setPickerOpen(true)}
                        >
                            {/* plus icon */}
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            {t("items.addMore", { defaultValue: "Add more products" })}
                        </button>

                        {items.length > 0 && (
                            <button
                                type="button"
                                className="
                  inline-flex items-center gap-2 rounded-lg border border-transparent
                  px-3 py-2 text-sm font-medium text-[#6b5545]
                  hover:bg-[#f1e7d6]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44c] focus-visible:ring-offset-2
                "
                                onClick={() => setClearOpen(true)}
                            >
                                {/* trash icon */}
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                                    <path d="M10 11v6M14 11v6"></path>
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                                </svg>
                                {t("items.clear", { defaultValue: "Clear cart" })}
                            </button>
                        )}
                    </div>
                </div>

                {/* Items list / Empty state */}
                {items.length === 0 ? (
                    <div className="grid place-items-center py-10 text-center">
                        <div className="mb-3 opacity-70">
                            {/* shopping bag icon */}
                            <svg
                                width="36"
                                height="36"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mx-auto"
                            >
                                <path d="M6 2l3 3h6l3-3" />
                                <path d="M6 6h12l-1 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 6z" />
                                <path d="M9 10v-2a3 3 0 0 1 6 0v2" />
                            </svg>
                        </div>
                        <p className="text-sm text-[#6b5545]">
                            {t("items.empty", { defaultValue: "No items in cart." })}
                        </p>
                        <button
                            type="button"
                            className="
                mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2
                text-sm font-medium text-[#2d1a14] border border-[#c9a44c]
                hover:shadow-sm hover:ring-1 hover:ring-[#c9a44c]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44c] focus-visible:ring-offset-2
                bg-white/60
              "
                            onClick={() => setPickerOpen(true)}
                        >
                            {/* plus icon */}
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            {t("items.addMore", { defaultValue: "Add more products" })}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence initial={false}>
                            {items.map((i) => (
                                <motion.div
                                    key={i.id + "::" + i.variantId}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.18 }}
                                    className="
                    rounded-xl border border-[#e7dbc9] bg-white/70
                    hover:border-[#c9a44c] hover:shadow-sm
                    transition-colors
                    p-3
                  "
                                >
                                    <Line
                                        item={i}
                                        currency={i.currency || currency}
                                        onInc={(it) => handleInc(it)}
                                        onDec={(it) => handleDec(it)}
                                        onRemove={(it) => handleRemove(it)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Summary card */}
            <div className="rounded-2xl border border-[#e7dbc9] bg-[#fffaf3] shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                    <div className="opacity-80">
                        {t("payment.subtotal", { defaultValue: "Subtotal" })}:{" "}
                        {fmt(subtotal || 0, currency)}
                    </div>
                    <div className="opacity-80">
                        {t("payment.delivery", { defaultValue: "Delivery" })}:{" "}
                        {fmt(deliveryFee || 0, currency)}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs uppercase tracking-wide text-[#857567]">
                        {t("payment.total", { defaultValue: "Total" })}
                    </div>
                    <div className="text-2xl font-semibold text-[#2d1a14]">
                        {fmt(total, currency)}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    className="
            inline-flex items-center justify-center rounded-xl px-4 py-2.5
            text-sm font-medium text-[#2d1a14]
            border border-[#e7dbc9] bg.white/70
            hover:border-[#c9a44c] hover:shadow-sm
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a44c] focus-visible:ring-offset-2
          "
                    onClick={onBack}
                >
                    {t("common.back", { defaultValue: "Back" })}
                </button>

                <button
                    type="button"
                    onClick={goNext}
                    disabled={items.length === 0}
                    className={`
            inline-flex items-center justify-center rounded-xl px-5 py-3
            text-sm font-semibold transition
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            ${
                        items.length === 0
                            ? "bg-[#e8dfd0] text-[#9b8b7c] cursor-not-allowed"
                            : "bg-gradient-to-br from-[#4b2e24] to-[#2d1a14] text-white shadow-md focus-visible:ring-[#c9a44c]"
                    }
          `}
                >
                    {t("common.next", { defaultValue: "Next" })}
                </button>
            </div>

            {/* Product picker modal */}
            <AnimatePresence initial={false} mode="wait">
                {pickerOpen && (
                    <ProductPicker
                        open={pickerOpen}
                        onClose={() => setPickerOpen(false)}
                        onAdd={(line) => add(line)}
                        currency={currency}
                    />
                )}
            </AnimatePresence>

            {/* Clear cart confirmation */}
            <LeaveGuard
                open={clearOpen}
                onCancel={() => setClearOpen(false)}
                onConfirm={() => {
                    setClearOpen(false);
                    replace([]);
                }}
                danger
                title={t("items.clearTitle", { defaultValue: "Clear your cart?" })}
                hint={t("items.clearHint", {
                    defaultValue:
                        "This will remove all items from your cart. This action cannot be undone.",
                })}
                confirmLabel={t("items.clear", { defaultValue: "Clear cart" })}
                cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
            />
        </div>
    );
}
