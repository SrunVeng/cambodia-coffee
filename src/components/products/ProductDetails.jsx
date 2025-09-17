import { useState } from 'react'
import { fmt } from '../../utils/currency'
import { useCart } from '../../store/cart'

export default function ProductDetails({ product, onClose }){
    const add = useCart(s=>s.add)
    const [variant, setVariant] = useState(product.variants?.[0]?.id || 'base')
    const delta = product.variants?.find(v=>v.id===variant)?.delta || 0
    const price = product.price + delta

    return (
        <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center px-4" onClick={onClose}>
            <div className="card w-full max-w-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
                <div className="grid md:grid-cols-2">
                    <img src={product.images?.[0]} alt="" className="w-full h-full object-cover"/>
                    <div className="p-5 space-y-3">
                        <h3 className="text-xl font-semibold">{product.title}</h3>
                        <p className="opacity-80 text-sm">{product.desc}</p>
                        {product.variants?.length>0 && (
                            <select className="badge"
                                    value={variant} onChange={e=>setVariant(e.target.value)}>
                                {product.variants.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}
                            </select>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="text-lg font-semibold">{fmt(price, product.currency)}</div>
                            <button className="btn btn-primary"
                                    onClick={()=> { add({ id:product.id, title:product.title, price, variantId:variant, qty:1 }); onClose?.() }}>
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
