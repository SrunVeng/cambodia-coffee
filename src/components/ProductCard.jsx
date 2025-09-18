import { useState, useMemo } from "react";
import { Tag, ShoppingCart, PackageX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fmt } from "../utils/currency.js";
import RatingStars from "./RatingStars";
import { tField } from "../utils/i18n-helpers.js";

export default function ProductCard({ p, lang, currency, onAdd }) {
    const { t } = useTranslation();
    const localizedTitle = tField(p.title, lang);
    const localizedTags = useMemo(() => {
        if (Array.isArray(p?.tags?.[lang])) return p.tags[lang];
        if (Array.isArray(p?.tags?.en)) return p.tags.en;
        return [];
    }, [p, lang]);

    // Variant helpers: label can be string or {en,kh,cn}
    const vLabel = (v) => tField(v?.label ?? t("products.base", { defaultValue: "Base" }), lang);

    const variants = Array.isArray(p.variants) ? p.variants : [];
    const initialId = variants?.[0]?.id ?? "base";
    const [variantId, setVariantId] = useState(initialId);

    const currentVariant = useMemo(() => {
        if (!variants.length) return { id: "base", delta: 0, label: t("products.base", { defaultValue: "Base" }) };
        return variants.find((v) => v.id === variantId) ?? variants[0];
    }, [variants, variantId, t]);

    const unit = (Number(p.price) || 0) + (Number(currentVariant?.delta) || 0);
    const cardCurrency = p.currency || currency;

    // Stock (optional): prefer variant stock if present, else product stock; undefined => treat as available
    const variantStock = typeof currentVariant?.stock === "number" ? currentVariant.stock : undefined;
    const productStock = typeof p?.stock === "number" ? p.stock : undefined;
    const isSoldOut = (variantStock !== undefined ? variantStock <= 0 : productStock !== undefined ? productStock <= 0 : false);

    const onAddClick = () => {
        if (isSoldOut) return;
        onAdd?.({
            id: p.id,
            code: p.code,
            title: localizedTitle,
            price: unit, // final unit price (base + delta)
            variantId: currentVariant.id,
            variantLabel: vLabel(currentVariant),
            qty: 1,
            currency: cardCurrency,
            image: p.images?.[0],
        });
    };

    return (
        <div
            className="
        group rounded-2xl border border-[#e7dbc9] bg-[#fffaf3] p-3 sm:p-4
        hover:border-[#c9a44c] hover:shadow-sm transition
      "
        >
            <div className="flex gap-3">
                {/* Image */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                    <img
                        src={p.images?.[0]}
                        alt={localizedTitle}
                        className="
              w-full h-full object-cover rounded-xl border border-[#e7dbc9]
              bg-white
            "
                        loading="lazy"
                    />
                    {/* Optional badge */}
                    {p.badge && (
                        <span
                            className="
                absolute -top-1 -left-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold
                bg-[#2d1a14] text-white shadow
              "
                            title={tField(p.badge, lang)}
                        >
              {tField(p.badge, lang)}
            </span>
                    )}
                    {/* Sold out ribbon */}
                    {isSoldOut && (
                        <div className="absolute inset-0 grid place-items-center rounded-xl bg-black/30 backdrop-blur-[1px]">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-[#2d1a14]">
                <PackageX className="w-3.5 h-3.5" />
                  {t("products.soldOut", { defaultValue: "Sold out" })}
              </span>
                        </div>
                    )}
                </div>

                {/* Right content */}
                <div className="min-w-0 flex-1">
                    {/* Title + rating */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="font-semibold text-[#2d1a14] truncate">{localizedTitle}</div>
                            {p.code && <div className="text-xs text-[#857567] truncate">{p.code}</div>}
                        </div>
                        <RatingStars value={p.rating} />
                    </div>

                    {/* Tags */}
                    {localizedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {localizedTags.slice(0, 3).map((tag) => (
                                <span
                                    key={tag}
                                    className="
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                    border border-[#e7dbc9] bg-white/60 text-[11px] text-[#6b5545]
                  "
                                    title={tag}
                                >
                  <Tag className="w-3 h-3" />
                  <span className="truncate max-w-[9rem]">{tag}</span>
                </span>
                            ))}
                        </div>
                    )}

                    {/* Variants */}
                    {variants.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {variants.map((v) => {
                                const active = v.id === variantId;
                                return (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => setVariantId(v.id)}
                                        className={[
                                            "px-3 py-1 rounded-full border text-sm transition",
                                            active
                                                ? "bg-[#2d1a14] text-white border-[#2d1a14] ring-2 ring-offset-1 ring-[#c9a44c]"
                                                : "bg-white/60 text-[#2d1a14] border-[#e7dbc9] hover:border-[#c9a44c]",
                                        ].join(" ")}
                                    >
                                        {vLabel(v)}
                                        {typeof v.delta === "number" && v.delta !== 0 && (
                                            <span className="ml-1 text-[11px] opacity-80">
                        {v.delta > 0 ? `+${fmt(v.delta, cardCurrency)}` : `${fmt(v.delta, cardCurrency)}`}
                      </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Price + Add */}
                    <div className="mt-3 flex items-center justify-between">
                        <div className="leading-none">
                            <div className="text-xs uppercase tracking-wide text-[#857567]">
                                {t("products.price", { defaultValue: "Price" })}
                            </div>
                            <div className="font-semibold text-lg text-[#2d1a14]">{fmt(unit, cardCurrency)}</div>
                        </div>

                        <button
                            type="button"
                            disabled={isSoldOut}
                            onClick={onAddClick}
                            className={[
                                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none",
                                "focus-visible:ring-2 focus-visible:ring-offset-2",
                                isSoldOut
                                    ? "bg-[#e8dfd0] text-[#9b8b7c] cursor-not-allowed"
                                    : "bg-gradient-to-br from-[#4b2e24] to-[#2d1a14] text-white shadow-md focus-visible:ring-[#c9a44c]",
                            ].join(" ")}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            {t("common.addToCart", { defaultValue: "Add to cart" })}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
