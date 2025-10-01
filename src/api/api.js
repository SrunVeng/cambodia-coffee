// src/api/api.js
// Hardcode your base here (change any time). No mock, no .env.
export const API_BASE = "http://localhost:8081";

export async function postJson(path, body, init = {}) {
    const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(init.headers || {}) },
        body: JSON.stringify(body),
        ...init,
    });

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

    if (!res.ok) {
        const err = new Error(data?.message || `Request failed (${res.status})`);
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

export async function getJson(path, init = {}) {
    const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, { method: "GET", ...init });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (!res.ok) {
        const err = new Error(data?.message || `Request failed (${res.status})`);
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

// Public endpoints you can change later on the backend side:
export function createOrder(payload) {
    // COD or generic “create order”
    return postJson("/api/v1/order/create", payload);
}

export function requestAbaPayment(payload) {
    // Backend should return { paymentId, qrString }
    return postJson("/payments/aba", payload);
}

export function pollPaymentStatus(paymentId) {
    return getJson(`/payments/aba/${encodeURIComponent(paymentId)}`);
}
