import { useEffect, useState, useCallback } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import LanguageSwitch from './LanguageSwitch'
import data from '../../data/data.json'
import CartIcon from '../cart/CartIcon'
import { useTranslation } from 'react-i18next'

// ---- Config
const NAV = [
    { to: '/', key: 'home' },
    { to: '/products', key: 'products' },
    { to: '/order', key: 'order' },
    { to: '/about', key: 'about' },
]

// ---- Small component: crisp hamburger that morphs to an "X"
function HamburgerButton({ open, onClick }) {
    return (
        <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={onClick}
            className="grid place-items-center w-10 h-10 rounded-2xl border border-[var(--ring)] bg-white/90 text-[var(--brand-ink)] hover:bg-white transition"
        >
      <span className="relative block w-5 h-4">
        <span
            className={`absolute inset-x-0 top-0 h-0.5 rounded-full bg-current transition-transform duration-300 ${
                open ? 'translate-y-[6px] rotate-45' : ''
            }`}
        />
        <span
            className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-current transition-opacity duration-200 ${
                open ? 'opacity-0' : 'opacity-100'
            }`}
        />
        <span
            className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-current transition-transform duration-300 ${
                open ? '-translate-y-[6px] -rotate-45' : ''
            }`}
        />
      </span>
        </button>
    )
}

// ---- Mobile drawer with overlay
function MobileDrawer({ open, onClose, children }) {
    return (
        <div aria-hidden={!open}>
            {/* Overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
                    open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />
            {/* Panel */}
            <aside
                id="mobile-drawer"
                className={`fixed right-0 top-0 z-50 h-dvh w-[84vw] max-w-sm 
        bg-[color:var(--brand-bg)]/95 backdrop-blur border-l border-[var(--ring)] shadow-xl 
        transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {children}
            </aside>
        </div>
    )
}

export default function Navbar() {
    const { t } = useTranslation()
    const { pathname } = useLocation()
    const [open, setOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    // shrink on scroll
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 6)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // close drawer on route change
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    // body scroll lock while drawer open
    useEffect(() => {
        const cls = 'overflow-hidden'
        if (open) document.body.classList.add(cls)
        else document.body.classList.remove(cls)
        return () => document.body.classList.remove(cls)
    }, [open])

    // close on Esc
    const onKeyDown = useCallback((e) => {
        if (e.key === 'Escape') setOpen(false)
    }, [])
    useEffect(() => {
        if (!open) return
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [open, onKeyDown])

    // close if resized to desktop
    useEffect(() => {
        const onResize = () => {
            if (window.matchMedia('(min-width:768px)').matches) setOpen(false)
        }
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 border-b border-[var(--ring)]
      transition-[height,box-shadow,background] duration-300 ${
                scrolled ? 'h-14 shadow-sm' : 'h-16'
            }`}
            style={{
                background: 'linear-gradient(to bottom, #f5f1ea, #f8f4ef)', // latte foam gradient
            }}
        >
            <div className="container-narrow flex h-full items-center justify-between">
                {/* Brand */}
                <Link to="/" className="group flex items-center gap-2">
                    <img
                        src={data.APP_LOGO}
                        alt="logo"
                        className="h-9 w-9 rounded-xl bg-white shadow-sm ring-1 ring-[var(--ring)] object-cover group-hover:scale-105 transition"
                    />
                    <span className="font-semibold tracking-tight text-[var(--brand-ink)] group-hover:opacity-90 transition">
            {data.APP_NAME}
          </span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {NAV.map(({ to, key }) => (
                        <NavLink
                            key={key}
                            to={to}
                            end
                            className={({ isActive }) =>
                                `relative text-sm opacity-80 hover:opacity-100 transition ${
                                    isActive
                                        ? 'active opacity-100 font-semibold text-[var(--brand-accent)]'
                                        : ''
                                }`
                            }
                        >
                            {t(`nav.${key}`)}
                            {/* underline indicator */}
                            <span className="pointer-events-none absolute left-0 -bottom-1 h-0.5 w-0 rounded-full bg-[var(--brand-accent)] transition-all duration-300" />
                        </NavLink>
                    ))}
                </nav>

                {/* Desktop actions */}
                <div className="hidden md:flex items-center gap-2">
                    <LanguageSwitch />
                    <CartIcon active={pathname === '/cart'} />
                </div>

                {/* Mobile actions */}
                <div className="md:hidden flex items-center gap-2">
                    <LanguageSwitch />
                    <CartIcon active={pathname === '/cart'} />
                    <HamburgerButton open={open} onClick={() => setOpen((v) => !v)} />
                </div>
            </div>

            {/* Desktop underline animation */}
            <style>{`@media (min-width:768px){ nav a:hover>span, nav a.active>span { width:100% } }`}</style>

            {/* Mobile Drawer */}
            <MobileDrawer open={open} onClose={() => setOpen(false)}>
                <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="font-semibold">{data.APP_NAME}</span>
                        <button
                            aria-label="Close menu"
                            onClick={() => setOpen(false)}
                            className="grid place-items-center w-10 h-10 rounded-2xl border border-[var(--ring)] bg-white hover:bg-white/90 transition"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M6 6l12 12M18 6L6 18"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex flex-col">
                        {NAV.map(({ to, key }) => (
                            <NavLink
                                key={key}
                                to={to}
                                end
                                className={({ isActive }) =>
                                    `block rounded-2xl px-3 py-3 text-base transition ${
                                        isActive ? 'bg-white font-semibold' : 'hover:bg-white'
                                    }`
                                }
                                onClick={() => setOpen(false)}
                            >
                                {t(`nav.${key}`)}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="mt-4">
                        <Link
                            to="/products"
                            className="btn btn-primary w-full text-center"
                            onClick={() => setOpen(false)}
                        >
                            {t('home.cta') || 'Shop Coffee'}
                        </Link>
                    </div>
                </div>
            </MobileDrawer>
        </header>
    )
}
