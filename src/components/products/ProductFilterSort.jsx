import { useState } from 'react'
import cats from '../../data/product-categories.json'

export default function ProductFilterSort({ onChange }){
    const [cat, setCat] = useState('all')
    const [sort, setSort] = useState('popular')

    const emit= (c=cat, s=sort)=> onChange?.({ category:c, sort:s })

    return (
        <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 items-center">
                <span className="text-sm opacity-70">Filter</span>
                <select className="badge" value={cat}
                        onChange={(e)=>{ setCat(e.target.value); emit(e.target.value, sort) }}>
                    <option value="all">All</option>
                    {cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="flex gap-2 items-center">
                <span className="text-sm opacity-70">Sort</span>
                <select className="badge" value={sort}
                        onChange={(e)=>{ setSort(e.target.value); emit(cat, e.target.value) }}>
                    <option value="popular">Popularity</option>
                    <option value="price-asc">Price ↑</option>
                    <option value="price-desc">Price ↓</option>
                    <option value="newest">Newest</option>
                </select>
            </div>
        </div>
    )
}
