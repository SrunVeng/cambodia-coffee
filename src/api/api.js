import axios from 'axios'

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE || '',
    timeout: 20000
})

export async function createOrder(payload){
    // payload: { currency, amount, items, address, email, name, phone, method, note? }
    const { data } = await client.post('/create/order', payload)
    return data // expect { orderId, receiptNo, createdAt, ... }
}

export async function requestAbaPayment(payload){
    // returns { paymentId, qrString, ... }
    const { data } = await client.post('/payment/aba', payload)
    return data
}

export async function pollPaymentStatus(paymentId){
    // optional helper if your backend exposes it; otherwise you can rely on webhook -> /create/order callback flow
    const { data } = await client.get(`/payment/status/${paymentId}`)
    return data // { status: 'pending'|'paid'|'failed' }
}
