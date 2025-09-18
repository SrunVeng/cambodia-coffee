import { useCart } from '../../store/cart'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function CartIcon({ active }) {
    const items = useCart(s => s.items)
    const { t } = useTranslation()
    const count = items.reduce((s, i) => s + i.qty, 0)

    return (
        <Link
            to="/order"
            aria-label={t('nav.cart')}
            className={`relative flex items-center justify-center w-10 h-10 rounded-2xl border border-[var(--ring)] 
                bg-white/90 text-[var(--brand-ink)] transition-all duration-200
                hover:bg-white hover:scale-105 hover:shadow-sm
                ${active ? 'ring-2 ring-[var(--brand-ink)]/30 shadow' : ''}`}
        >
            {/* Cart Icon - cleaner basket with handle */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.5 8h19l-2 11.5a2 2 0 01-2 1.5h-11a2 2 0 01-2-1.5L2.5 8z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 8a4 4 0 118 0"
                />
            </svg>

            {/* Badge */}
            {count > 0 && (
                <span
                    key={count} // re-ui when count changes
                    className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px]
                        rounded-full bg-[var(--brand-ink)] text-white text-[11px] font-semibold
                        shadow-md animate-bounceIn"
                >
                    {count}
                </span>
            )}
        </Link>
    )
}
