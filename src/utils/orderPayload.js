// src/utils/orderPayload.js

export function normalizeCartItems(items = []) {
    return items.map((it) => {
        const qty = Number(it.qty ?? 1);
        const unitPrice = Number(it.price ?? 0);
        const lineTotal = qty * unitPrice;
        return {
            id: it.id || null,
            sku: it.code || it.id || null,
            name: it.title || it.label || "Item",
            variantId: it.variantId || null,
            qty,
            unitPrice,
            lineTotal,
            currency: it.currency || null,
            raw: it,
        };
    });
}

export function buildOrderPayload({
                                      customer = {},
                                      address = {},
                                      items = [],
                                      currency = "KHR", // incoming UI currency (your cart)
                                      deliveryFee = 0,
                                      locale = "en",
                                      meta = {},
                                  }) {
    const normalized = normalizeCartItems(items);
    const subtotal = normalized.reduce((s, x) => s + Number(x.lineTotal || 0), 0);
    const total = subtotal + Number(deliveryFee || 0);

    return {
        customer: {
            name: customer.name || "",
            phone: customer.phone || "",
            email: customer.email || "",
        },
        address: {
            province: address.provinceName || "",
            district: address.districtName || "",
            commune: address.communeName || "",
            village: address.villageName || "",
            street: address.street || "",
            provinceCode: address.province || null,
            districtCode: address.district || null,
            communeCode: address.commune || null,
            villageCode: address.village || null,
        },
        cart: {
            currency,      // KHR in UI
            items,         // original lines
            normalized,    // normalized UI lines (KHR)
            subtotal,
            deliveryFee: Number(deliveryFee || 0),
            total,
        },
        meta: {
            submittedAt: new Date().toISOString(),
            locale,
            ...meta,
        },
    };
}
