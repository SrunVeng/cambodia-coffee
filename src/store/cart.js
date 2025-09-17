import { create } from 'zustand'
import { ls } from '../utils/persist'

const KEY = 'coffee_cart_v1'

export const useCart = create((set, get)=>({
    items: ls.get(KEY, []),
    add(item){
        const items = [...get().items]
        const idx = items.findIndex(i=> i.id===item.id && i.variantId===item.variantId)
        if(idx>-1) items[idx].qty += item.qty || 1
        else items.push({ ...item, qty: item.qty || 1 })
        ls.set(KEY, items); set({ items })
    },
    remove(itemKey){
        const items = get().items.filter(i=>!(i.id===itemKey.id && i.variantId===itemKey.variantId))
        ls.set(KEY, items); set({ items })
    },
    setQty(itemKey, qty){
        const items = get().items.map(i=> (i.id===itemKey.id && i.variantId===itemKey.variantId) ? {...i, qty} : i)
        ls.set(KEY, items); set({ items })
    },
    clear(){ ls.del(KEY); set({ items: [] }) },
    subtotal(){ return get().items.reduce((s,i)=> s + i.price*i.qty, 0) },
}))
