import { useEffect, useMemo, useState } from 'react'
import productsData from '../../data/products.json'
import ProductCard from './ProductCard'
import ProductDetails from './ProductDetails'

export default function ProductGrid({ filter }){
    const [active, setActive] = useState(null)

    const items = useMemo(()=>{
        let arr = [...productsData]
        if(filter?.category && filter.category!=='all'){
            arr = arr.filter(p=>p.category===filter.category)
        }
        if(filter?.sort==='price-asc') arr.sort((a,b)=>a.price-b.price)
        else if(filter?.sort==='price-desc') arr.sort((a,b)=>b.price-a.price)
        else if(filter?.sort==='newest') arr.sort((a,b)=> (b.createdAt||0)-(a.createdAt||0))
        return arr
    },[filter])

    useEffect(()=>{ setActive(null) },[filter])

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(p=>(
                    <ProductCard key={p.id} p={p} onClick={()=>setActive(p)} />
                ))}
            </div>
            {active && <ProductDetails product={active} onClose={()=>setActive(null)} />}
        </>
    )
}
