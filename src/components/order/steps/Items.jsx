import { useCart } from '../../../store/cart'
import { fmt } from '../../../utils/currency'

export default function Items({ deliveryFee, onNext, onBack }){
    const items = useCart(s=>s.items)
    const subtotal = useCart(s=>s.subtotal()) || 0
    const total = subtotal + (deliveryFee||0)

    return (
        <div className="space-y-4">
            <div className="card p-4">
                {items.length===0 ? <div>No items in cart.</div> : (
                    <ul className="space-y-2">
                        {items.map(i=>(
                            <li key={i.id+i.variantId} className="flex items-center justify-between">
                                <div>{i.title} <span className="opacity-70">({i.variantId}) × {i.qty}</span></div>
                                <div>{fmt(i.price*i.qty, 'KHR')}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="card p-4 flex items-center justify-end gap-6">
                <div className="opacity-80">Delivery: {fmt(deliveryFee||0, 'KHR')}</div>
                <div className="font-semibold">Total: {fmt(total, 'KHR')}</div>
            </div>
            <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={onBack}>Back</button>
                <button className="btn btn-primary" onClick={()=> onNext?.({ deliveryFee, subtotal, total })}>Next</button>
            </div>
        </div>
    )
}
