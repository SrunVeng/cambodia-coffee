// src/utils/orderPayload.js

/**
 * Helpers
 */
const toStrMoney = (v) => {
    const n = Number(v || 0);
    // keep as plain string (no thousands separators), 2 dp for non-KHR
    return n.toString();
};
const toStrInt = (v) => Math.round(Number(v || 0)).toString();

const clamp3 = (s, fallback = "USD") =>
    typeof s === "string" && s.length === 3 ? s.toUpperCase() : fallback;

const normalizeLang = (lang) => {
    if (!lang) return "en";
    const l = String(lang).toLowerCase();
    if (l.startsWith("kh") || l.startsWith("km")) return "kh";
    if (l.startsWith("en")) return "en";
    return l.slice(0, 2);
};

/**
 * Normalize cart items from your UI/cart into the backend Item shape.
 * Expects each input item to look like:
 * { sku?, name?/title?, qty?, unitPrice?/price?, currency? }
 */
export function normalizeItemsToVo(items = [], itemCurrency = "USD") {
    const currency = clamp3(itemCurrency, "USD");

    return (Array.isArray(items) ? items : []).map((it, idx) => {
        const name =
            it?.name ??
            it?.title ??
            it?.label ??
            `Item ${idx + 1}`;

        const qty = Number(
            it?.qty ?? it?.quantity ?? it?.count ?? 1
        );

        const unitPrice = Number(
            it?.unitPrice ?? it?.price ?? it?.amount ?? 0
        );

        const lineTotal = Number(
            it?.lineTotal ?? it?.total ?? qty * unitPrice
        );

        return {
            sku: String(it?.sku ?? it?.code ?? it?.id ?? `SKU_${idx + 1}`),
            name: String(name),
            qty: Math.max(1, qty),
            unitPrice: toStrMoney(unitPrice),
            lineTotal: toStrMoney(lineTotal),
            currency,
        };
    });
}

/**
 * Build "gmaps_search" link from lat/lng if not provided.
 */
const buildGmapsSearch = ({ lat, lng }) =>
    (lat != null && lng != null)
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        : undefined;

/**
 * Build the exact backend VO payload.
 *
 * @param {{
 *  method: 'cod'|'aba'|string,
 *  language?: string,              // 'kh' | 'en'
 *  currency?: string,              // 3-letter, e.g. 'USD'
 *  customer: { name:string, phone:string, email?:string },
 *  address: {
 *    province:string, district:string, commune:string, village:string, street?:string,
 *    provinceCode:string, districtCode:string, communeCode:string, villageCode:string,
 *    geo?: { lat:number, lng:number }, geoSrc?:string, geoTrusted?:boolean, geoConfirmed?:boolean,
 *    gmaps_search?:string
 *  },
 *  items: any[],                   // UI line items; will be normalized
 *  deliveryFee?: number|string,
 *  // KHR conversion (for Summary.original). If not provided, defaults to 4100.
 *  khrRate?: number,
 *  userAgent?: string,
 *  step?: string,                  // e.g., 'payment'
 *  source?: string,                // e.g., 'web'
 *  locale?: string,                // e.g., 'en-US'
 * }} args
 */
export function buildOrderRequestVo(args) {
    const {
        method,
        language,
        currency = "USD",
        customer = {},
        address = {},
        items = [],
        deliveryFee = 0,
        khrRate = (typeof window !== "undefined" && window.__KHR_RATE__) || 4100,
        userAgent = (typeof navigator !== "undefined" && navigator.userAgent) || "unknown",
        step = "payment",
        source = "web",
        locale = (typeof navigator !== "undefined" && navigator.language) || "en-US",
    } = args || {};

    // --- currency & lang ---
    const cur = clamp3(currency, "USD");
    const lang = normalizeLang(language);

    // --- items (normalized to VO) ---
    const voItems = normalizeItemsToVo(items, cur);

    // --- subtotal/total in display currency (cur) ---
    const subtotalNum = voItems.reduce((s, x) => s + Number(x.lineTotal), 0);
    const deliveryNum = Number(deliveryFee || 0);
    const totalNum = subtotalNum + deliveryNum;

    // --- "amount" top-level equals the Summary.total (in cur) as a string ---
    const amount = toStrMoney(totalNum);

    // --- Summary in 'cur' (strings) ---
    const summary = {
        subtotal: toStrMoney(subtotalNum),
        deliveryFee: toStrMoney(deliveryNum),
        total: toStrMoney(totalNum),
        currency: cur,
        original: {
            currency: "KHR",
            subtotalKHR: toStrInt(subtotalNum * Number(khrRate)),
            deliveryFeeKHR: toStrInt(deliveryNum * Number(khrRate)),
            totalKHR: toStrInt(totalNum * Number(khrRate)),
        },
    };

    // --- Address shape matches VO exactly (with gmaps_search snake_case) ---
    const adrGeo =
        address?.geo && typeof address.geo === "object"
            ? { lat: Number(address.geo.lat), lng: Number(address.geo.lng) }
            : undefined;

    const gmapsSearch =
        address?.gmaps_search ||
        buildGmapsSearch(adrGeo || {});

    const voAddress = {
        province: String(address?.province ?? address?.provinceName ?? ""),
        district: String(address?.district ?? address?.districtName ?? ""),
        commune: String(address?.commune ?? address?.communeName ?? ""),
        village: String(address?.village ?? address?.villageName ?? ""),
        street: address?.street ? String(address.street) : undefined,

        provinceCode: String(address?.provinceCode ?? address?.province ?? ""),
        districtCode: String(address?.districtCode ?? address?.district ?? ""),
        communeCode: String(address?.communeCode ?? address?.commune ?? ""),
        villageCode: String(address?.villageCode ?? address?.village ?? ""),

        geoTrusted: Boolean(address?.geoTrusted) || false,
        geo: adrGeo,
        geoSrc: address?.geoSrc ? String(address.geoSrc) : undefined,
        geoConfirmed: Boolean(address?.geoConfirmed) || false,

        // must be snake_case to match @JsonProperty("gmaps_search")
        gmaps_search: gmapsSearch,
    };

    // --- Meta (matches VO; note: geoTrusted is String per VO) ---
    const meta = {
        submittedAt: new Date().toISOString(),
        source: String(source || "web"),
        step: String(step || "payment"),
        userAgent: String(userAgent),
        locale: String(locale),
        coords: adrGeo,
        geoSrc: address?.geoSrc ? String(address.geoSrc) : undefined,
        // VO declares Meta.geoTrusted as String; send "true"/"false"
        geoTrusted: String(Boolean(address?.geoTrusted || false)),
        // snake_case key to match @JsonProperty("gmaps_search")
        gmaps_search: gmapsSearch,
    };

    // --- Customer (required) ---
    const voCustomer = {
        name: String(customer?.name ?? ""),
        phone: String(customer?.phone ?? ""),
        email: customer?.email ? String(customer.email) : undefined,
    };

    return {
        method: String(method || "cod"),
        amount,          // String
        currency: cur,   // 3-letter
        language: lang,  // 'kh' | 'en' (your backend uses plain string)
        customer: voCustomer,
        address: voAddress,
        items: voItems,
        summary,
        meta,
    };
}

/**
 * Backward compatibility export (if other parts still import buildOrderPayload)
 */
export const buildOrderPayload = buildOrderRequestVo;
