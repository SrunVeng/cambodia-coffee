import rawProducts from "../data/products.json";
import QtyStepper from "./QtyStepper";
import { X, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fmt } from "../utils/currency";
import { normalizeLang, tField } from "../utils/i18n-helpers.js";
import { motion, AnimatePresence } from "framer-motion";

/** Normalize possible JSON shapes to a plain array */
function toProductsArray(src) {
    if (!src) return [];
    const unwrapped = src.default ?? src;
    if (Array.isArray(unwrapped)) return unwrapped;
    if (Array.isArray(unwrapped?.products)) return unwrapped.products;
    return [];
}
const PRODUCTS = toProductsArray(rawProducts);

export default function Line({ item, currency, onInc, onDec, onRemove }) {
    const { t, i18n } = useTranslation();
    const lang = normalizeLang(i18n.language);

    const product = PRODUCTS.find((p) => p.id === item.id);
    const img = item.image || product?.images?.[0];

    const variantObj = product?.variants?.find((v) => v.id === item.variantId);
    const variantLabel =
        (variantObj ? tField(variantObj.label, lang) : null) ||
        item.variantLabel ||
        (item.variantId && item.variantId !== "base" ? item.variantId : "");

    const title = item.title || tField(product?.title, lang);
    const code = item.code || product?.code || item.id;

    const unit = Number(item.price || 0);
    const qty = Number(item.qty || 0);
    const lineTotal = unit * qty;
    const lineCurrency = item.currency || currency;

    return (
        <div
            className="
        flex flex-col gap-3 sm:gap-4
        sm:flex-row sm:items-center sm:justify-between
      "
        >
            {/* LEFT: image + meta */}
            <div className="flex items-center gap-3 min-w-0">
                {img ? (
                    <img
                        src={img}
                        alt={title}
                        className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover flex-shrink-0 border border-[#e7dbc9] bg-white"
                        loading="lazy"
                    />
                ) : (
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-[#fffaf3] border border-[#e7dbc9] grid place-items-center text-[11px] text-[#857567]">
                        IMG
                    </div>
                )}

                <div className="min-w-0">
                    <div className="font-medium text-[#2d1a14] truncate" title={title}>
                        {title}
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[#6b5545]">
            <span className="truncate">
              {t("products.code", { defaultValue: "Code" })}: {code}
            </span>
                        {variantLabel ? (
                            <>
                                <span className="opacity-50">•</span>
                                <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-[#e7dbc9] bg-white/70 text-[11px] text-[#6b5545]"
                                    title={variantLabel}
                                >
                  <Tag className="w-3 h-3" />
                  <span className="truncate max-w-[10rem]">
                    {t("products.variant", { defaultValue: "Variant" })}: {variantLabel}
                  </span>
                </span>
                            </>
                        ) : null}
                    </div>

                    {/* Mobile: unit x qty */}
                    <div className="sm:hidden mt-1 text-[11px] text-[#857567]">
                        {fmt(unit, lineCurrency)} × {qty}
                    </div>
                </div>
            </div>

            {/* RIGHT: prices + qty + remove */}
            <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-auto">
                {/* Unit (desktop) */}
                <div className="hidden sm:block text-right leading-tight min-w-[9rem]">
                    <div className="text-[11px] uppercase tracking-wide text-[#857567]">
                        {t("cart.unit", { defaultValue: "Unit" })}
                    </div>
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={`u-${unit}-${lineCurrency}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            className="font-semibold text-[#2d1a14]"
                        >
                            {fmt(unit, lineCurrency)}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Qty */}
                <QtyStepper
                    value={qty}
                    onDec={() => onDec(item)}
                    onInc={() => onInc(item)}
                    min={1}
                />

                {/* Total */}
                <div className="text-right leading-tight min-w-[10.5rem]">
                    <div className="text-[11px] uppercase tracking-wide text-[#857567]">
                        {t("cart.total", { defaultValue: "Total" })}
                    </div>
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={`t-${lineTotal}-${lineCurrency}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            className="font-semibold text-[#2d1a14]"
                        >
                            {fmt(lineTotal, lineCurrency)}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Remove button (separate, rounded, animated) */}
                <motion.button
                    type="button"
                    onClick={() => onRemove(item)}
                    title={t("common.remove", { defaultValue: "Remove" })}
                    aria-label={t("common.remove", { defaultValue: "Remove" })}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.92 }}
                    className="
            h-9 w-9 grid place-items-center rounded-full border
            border-red-200 text-red-600 bg-white/70
            hover:bg-red-50 hover:shadow-sm
            focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2
          "
                >
                    <X className="w-4 h-4" />
                </motion.button>
            </div>
        </div>
    );
}
