import { useCart } from '../../store/cart'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function CartIcon(){
    const items = useCart(s=>s.items)
    const { t } = useTranslation()
    const count = items.reduce((s,i)=>s+i.qty,0)
    return (
        <Link to="/order" className="relative badge">
            {t('nav.cart')}
            <span className="absolute -top-2 -right-2 text-xs rounded-full px-1 bg-[var(--brand-ink)] text-white">
        {count}
      </span>
        </Link>
    )
}
