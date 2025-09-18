// src/utils/ui.js

// ---- LocalStorage helpers -------------------------------------------------
export const LS_KEYS = {
    INFO: "info",
    SUMMARY: "summary",
    RECEIPT: "receipt",
    CART: "items",
};

export function readJSON(key, fallback = null) {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

export function writeJSON(key, value) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {}
}

export function removeKey(key) {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(key);
    } catch {}
}

// ---- Language / labels ----------------------------------------------------
export function normalizeLang(lang = "en") {
    const v = String(lang || "en").toLowerCase();
    if (v === "km") return "kh";
    if (v === "zh") return "cn";
    return ["en", "kh", "cn"].includes(v) ? v : "en";
}

export function labelText(label, lang = "en") {
    if (!label) return "";
    if (typeof label === "string") return label;
    const L = normalizeLang(lang);
    return label[L] ?? label.en ?? label.kh ?? label.cn ?? "";
}

// Build step labels from i18n: order.steps (e.g., ["Info","Items","Review","Payment","Receipt"])
export function i18nSteps(t, count = 4) {
    const arr = t("order.steps", { returnObjects: true }) || [];
    return arr.slice(0, count).map((label, i) => ({ id: i, label }));
}

// Given current active index (0-based) and total, return completed boolean[]
export function completedFromActive(activeIdx, total) {
    return Array.from({ length: total }, (_, i) => i < activeIdx);
}

// ---- Currency helpers -----------------------------------------------------
// Business rule: API expects USD; UI/cart may be KHR. Convert by / 4000.
export function khrToUsd(valueKHR, rate = 4000) {
    const n = Number(valueKHR || 0);
    const usd = n / (rate || 4000);
    // round to 2 decimals for API amounts
    return Math.round((usd + Number.EPSILON) * 100) / 100;
}
