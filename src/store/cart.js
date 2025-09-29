// src/store/cart.js
import { create } from "zustand";

const KEY = "items";

function clampQty(v) {
    const n = Number(v || 0);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

function readItems() {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

function writeItems(items) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
        /* empty */
    }
}

export const useCart = create((set, get) => ({
    items: readItems(),

    add(item) {
        const items = [...get().items];
        const idx = items.findIndex(
            (i) => i.id === item.id && i.variantId === item.variantId
        );
        if (idx > -1) {
            items[idx].qty = clampQty((items[idx].qty || 0) + (item.qty || 1));
        } else {
            items.push({ ...item, qty: clampQty(item.qty || 1) });
        }
        writeItems(items);
        set({ items });
    },

    addOrIncrement(itemKey, delta = 1) {
        const items = [...get().items];
        const idx = items.findIndex(
            (i) => i.id === itemKey.id && i.variantId === itemKey.variantId
        );
        if (idx > -1) {
            items[idx].qty = clampQty((items[idx].qty || 0) + delta);
        } else {
            items.push({ ...itemKey, qty: clampQty(delta) });
        }
        writeItems(items);
        set({ items });
    },

    remove(itemKey) {
        const items = get().items.filter(
            (i) => !(i.id === itemKey.id && i.variantId === itemKey.variantId)
        );
        writeItems(items);
        set({ items });
    },

    setQty(itemKey, qty) {
        const items = get().items.map((i) =>
            i.id === itemKey.id && i.variantId === itemKey.variantId
                ? { ...i, qty: clampQty(qty) }
                : i
        );
        writeItems(items);
        set({ items });
    },

    increment(itemKey) {
        const items = get().items.map((i) =>
            i.id === itemKey.id && i.variantId === itemKey.variantId
                ? { ...i, qty: clampQty((i.qty || 0) + 1) }
                : i
        );
        writeItems(items);
        set({ items });
    },

    decrement(itemKey) {
        const items = get()
            .items.map((i) =>
                i.id === itemKey.id && i.variantId === itemKey.variantId
                    ? { ...i, qty: clampQty((i.qty || 0) - 1) }
                    : i
            )
            .filter((i) => i.qty > 0);
        writeItems(items);
        set({ items });
    },

    replace(nextItems = []) {
        const safe = nextItems.map((i) => ({ ...i, qty: clampQty(i.qty || 1) }));
        writeItems(safe);
        set({ items: safe });
    },

    clear() {
        try {
            localStorage.removeItem(KEY);
        } catch {
            /* empty */
        }
        set({ items: [] });
    },

    subtotal() {
        return get().items.reduce(
            (s, i) => s + (Number(i.price) || 0) * (i.qty || 0),
            0
        );
    },

    count() {
        return get().items.reduce((s, i) => s + (i.qty || 0), 0);
    },
}));

// keep tabs in sync
if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
        if (e.key === KEY) {
            try {
                const items = readItems();
                const curr = useCart.getState().items;
                if (JSON.stringify(items) !== JSON.stringify(curr)) {
                    useCart.setState({ items });
                }
            } catch {
                /* empty */
            }
        }
    });
}
