import { useCart } from '../../store/cart'
import { fmt } from '../../utils/currency'

export default function ProductCard({ p, onClick }){
    const add = useCart(s=>s.add)
    const firstVariant = p.variants?.[0]
    const basePrice = p.price + (firstVariant?.delta||0)

    return (
        <div className="card overflow-hidden">
            <button onClick={onClick} className="block">
                <img src={p.images?.[0]} alt="" className="w-full aspect-[4/3] object-cover"/>
            </button>
            <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-sm opacity-70">{p.tags?.join(' • ')}</div>
                    </div>
                    <div className="font-semibold">{fmt(basePrice, p.currency)}</div>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-ghost text-sm" onClick={onClick}>Details</button>
                    <button className="btn btn-primary text-sm"
                            onClick={()=> add({ id:p.id, title:p.title, price:p.price, variantId:firstVariant?.id||'base', qty:1 })}>
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    )
}
