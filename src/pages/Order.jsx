import { useEffect, useMemo, useState } from 'react'
import Stepper from '../components/order/Stepper'
import Info from '../components/order/steps/Info'
import Items from '../components/order/steps/Items'
import Review from '../components/order/steps/Review'
import Payment from '../components/order/steps/Payment'
import Receipt from '../components/order/steps/Receipt'
import { useCart } from '../store/cart'
import { kmDistance, deliveryFeeByKm } from '../utils/distance'
import data from '../data/data.json'
import { useTranslation } from 'react-i18next'

export default function Order(){
    const { t, i18n } = useTranslation()
    const steps = t('order.steps', { returnObjects: true })
    const [step, setStep] = useState(0)
    const [info, setInfo] = useState({})
    const [totals, setTotals] = useState({})
    const [receipt, setReceipt] = useState(null)
    const items = useCart(s=>s.items)
    const clear = useCart(s=>s.clear)

    // compute delivery fee using province center coords (dynamic by distance)
    async function computeDeliveryFee(address){
        if(!address?.province) return 0
        const provs = await (await fetch('/address/provinces.json')).json()
        const list = provs.provinces || provs
        const p = list.find(x=> x.code===address.province)
        if(!p) return 0
        const km = kmDistance(
            { lat:data.WAREHOUSE_COORDS.lat, lng:data.WAREHOUSE_COORDS.lng },
            { lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) }
        )
        return deliveryFeeByKm(km)
    }

    const goPaid = (res)=>{
        setReceipt(res.receipt)
        clear()
        setStep(4)
    }

    return (
        <section className="section">
            <div className="container-narrow space-y-6">
                <h2>{t('order.title')}</h2>
                <Stepper steps={steps} active={step} />

                {step===0 && <Info data={info} onNext={async (v)=>{
                    const fee = await computeDeliveryFee(v.address)
                    setInfo(v)
                    setTotals(s=>({ ...s, deliveryFee: fee, items, currency: data.CURRENCY }))
                    setStep(1)
                }} />}

                {step===1 && <Items deliveryFee={totals.deliveryFee}
                                    onBack={()=>setStep(0)}
                                    onNext={({subtotal,total})=>{
                                        setTotals(s=>({ ...s, subtotal, total, items }))
                                        setStep(2)
                                    }} />}

                {step===2 && <Review info={info} summary={totals}
                                     onBack={()=>setStep(1)} onNext={()=>setStep(3)} />}

                {step===3 && <Payment info={info} totals={totals}
                                      onBack={()=>setStep(2)} onPaid={goPaid} />}

                {step===4 && <Receipt receipt={receipt} onReset={()=>{ setStep(0); setReceipt(null) }} />}
            </div>
        </section>
    )
}
