import rawProducts from "../data/products.json";
import QtyStepper from "./QtyStepper";
import { Tag, Trash2 } from "lucide-react";
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

    // Localized title & variant label
    const variantObj = product?.variants?.find((v) => v.id === item.variantId);
    const variantLabel =
        (variantObj ? tField(variantObj.label, lang) : null) ||
        item.variantLabel ||
        (item.variantId && item.variantId !== "base" ? item.variantId : "");

    const title =
        item.title ||
        tField(product?.title, lang) ||
        t("products.untitled", { defaultValue: "Untitled" });
    const code = item.code || product?.code || item.id;

    const unit = Number(item.price || 0);
    const qty = Number(item.qty || 0);
    const lineTotal = unit * qty;
    const lineCurrency = item.currency || currency;

    const removeClick = () => {
        const msg = t("cart.confirmRemove", { defaultValue: "Remove this item?" });
        if (typeof window !== "undefined") {
            if (window.confirm(msg)) onRemove?.(item);
        } else {
            onRemove?.(item);
        }
    };

    return (
        <article
            className="
        relative max-w-full rounded-2xl border border-[#e7dbc9] bg-white/90
        p-3 sm:p-4 transition-[box-shadow,border-color] hover:border-[#c9a44c]
        hover:shadow-sm overflow-hidden
      "
            role="listitem"
        >
            {/* HEADER: image | title/meta | desktop unit */}
            <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 items-start">
                {/* Image */}
                <div className="shrink-0">
                    {img ? (
                        <img
                            src={img}
                            alt={title}
                            className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border border-[#e7dbc9] bg-white"
                            loading="lazy"
                        />
                    ) : (
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-[#fffaf3] border border-[#e7dbc9] grid place-items-center text-[11px] text-[#857567]">
                            IMG
                        </div>
                    )}
                </div>

                {/* Title + meta */}
                <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3
                                className="font-semibold text-[#241611] text-[15px] sm:text-base truncate"
                                title={title}
                            >
                                {title}
                            </h3>

                            {/* Meta row */}
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#6b5545]">
                <span className="truncate">
                  {t("products.code", { defaultValue: "Code" })}: {code}
                </span>

                                {variantLabel ? (
                                    <>
                                        <span className="opacity-40">•</span>
                                        <span
                                            className="
                        inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                        border border-[#e7dbc9] bg-white/70 text-[11px] leading-none
                        max-w-[12rem]
                      "
                                            title={variantLabel}
                                        >
                      <Tag className="w-3 h-3" aria-hidden="true" />
                      <span className="truncate">
                        {t("products.variant", { defaultValue: "Variant" })}:{" "}
                          {variantLabel}
                      </span>
                    </span>
                                    </>
                                ) : null}
                            </div>
                        </div>

                        {/* Desktop-only Unit */}
                        <div className="hidden sm:block text-right leading-tight shrink-0">
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
                    </div>

                    {/* MOBILE: Unit price badge (always visible) */}
                    <div className="mt-1 sm:hidden">
            <span className="inline-flex items-center gap-1 rounded-md border border-[#e7dbc9] bg-[#fffaf3] px-2 py-0.5 text-[12px] text-[#2d1a14]">
              <span className="uppercase tracking-wide text-[10px] text-[#857567]">
                {t("cart.unit", { defaultValue: "Unit" })}
              </span>
              <span className="font-medium">{fmt(unit, lineCurrency)}</span>
            </span>
                    </div>
                </div>
            </div>

            {/* CONTROLS: remove | qty | (spacer) | desktop total */}
            <div
                className="
          mt-2 sm:mt-3
          grid grid-cols-[auto_auto_1fr] sm:grid-cols-[auto_auto_1fr_auto]
          items-center gap-2 sm:gap-4
        "
            >
                {/* Remove (compact on mobile) */}
                <motion.button
                    type="button"
                    onClick={removeClick}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="
            h-9 px-3 inline-flex items-center gap-2 rounded-full border
            border-red-200 text-red-600 bg-white/90
            hover:bg-red-50 hover:shadow-sm focus:outline-none
            focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2
            shrink-0
          "
                    aria-label={t("common.remove", { defaultValue: "Remove" })}
                >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline text-sm">
            {t("common.remove", { defaultValue: "Remove" })}
          </span>
                </motion.button>

                {/* Qty stepper */}
                <div>
                    <QtyStepper
                        value={qty}
                        min={1}
                        onDec={() => onDec?.(item)}
                        onInc={() => onInc?.(item)}
                        size="md"
                    />
                </div>

                {/* Spacer */}
                <div className="justify-self-end sm:hidden text-[11px] text-[#857567]">
                    {/* Empty on purpose to keep grid shape on mobile */}
                </div>

                {/* Desktop total */}
                <div className="hidden sm:block justify-self-end text-right leading-tight min-w-[7.5rem]">
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
            </div>

            {/* MOBILE SUMMARY BAR: "Unit × Qty = Total" (always visible) */}
            <div
                className="
          sm:hidden mt-2 -mx-3 px-3 py-2 rounded-xl
          bg-[#fff8ea] border border-[#f0e6d6]
          flex items-center justify-between
        "
                aria-live="polite"
            >
                <div className="text-[12px] text-[#6b5545]">
                    {fmt(unit, lineCurrency)} × {qty}
                </div>
                <div className="text-[13px] font-semibold text-[#2d1a14]">
                    {fmt(lineTotal, lineCurrency)}
                </div>
            </div>
        </article>
    );
}
