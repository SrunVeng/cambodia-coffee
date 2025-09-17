export const currency = (n, cur = "USD") =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(n);

export const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));
export const loadJSON = (k, d = null) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; }
};

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
