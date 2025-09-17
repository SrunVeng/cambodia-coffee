import { useEffect, useState } from 'react'
import { requestAbaPayment, createOrder, pollPaymentStatus } from '../../../api/api'
import QRCode from 'qrcode'

export default function Payment({ info, totals, onPaid, onBack }){
    const [method, setMethod] = useState('cod')
    const [loading, setLoading] = useState(false)
    const [qr, setQr] = useState(null)
    const [paymentId, setPaymentId] = useState(null)
    const items = totals.items || []

    async function handleCOD(){
        setLoading(true)
        try{
            const payload = { method:'cod', currency: totals.currency||'KHR', amount: totals.total, items, address: info.address, email: info.email, name: info.name, phone: info.phone }
            const res = await createOrder(payload)
            onPaid?.({ receipt: res })
        } finally { setLoading(false) }
    }

    async function handleABA(){
        setLoading(true)
        try{
            const payload = { method:'aba', currency: totals.currency||'KHR', amount: totals.total, items, address: info.address, email: info.email, name: info.name, phone: info.phone }
            const res = await requestAbaPayment(payload) // { paymentId, qrString, ... }
            setPaymentId(res.paymentId)
            const dataUrl = await QRCode.toDataURL(res.qrString)
            setQr(dataUrl)
            // optional polling if you expose /payment/status/:id
            const poll = setInterval(async ()=>{
                try{
                    const st = await pollPaymentStatus(res.paymentId)
                    if(st.status==='paid'){ clearInterval(poll); onPaid?.({ receipt: st }) }
                }catch{}
            }, 3000)
            // If you only use webhooks to confirm & then create order, you can also show "Waiting for payment..." here.
        } finally { setLoading(false) }
    }

    return (
        <div className="space-y-4">
            <div className="card p-4 flex gap-3">
                <label className="badge"><input type="radio" name="pay" checked={method==='cod'} onChange={()=>setMethod('cod')}/> Cash on Delivery</label>
                <label className="badge"><input type="radio" name="pay" checked={method==='aba'} onChange={()=>setMethod('aba')}/> ABA Pay</label>
            </div>

            {method==='aba' && (
                <div className="card p-6 text-center space-y-3">
                    {qr ? <img src={qr} alt="ABA QR" className="mx-auto w-56 h-56"/> : <div>Generating QR...</div>}
                    {paymentId && <div className="text-sm opacity-70">Payment ID: {paymentId}</div>}
                    <div className="opacity-80">Scan to pay. Waiting for confirmation...</div>
                </div>
            )}

            <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={onBack}>Back</button>
                {method==='cod'
                    ? <button className="btn btn-primary" disabled={loading} onClick={handleCOD}>{loading?'...':'Confirm COD'}</button>
                    : <button className="btn btn-primary" disabled={loading} onClick={handleABA}>{loading?'...':'Generate QR'}</button>}
            </div>
        </div>
    )
}
