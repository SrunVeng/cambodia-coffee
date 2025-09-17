import { useEffect, useState, useCallback } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import LanguageSwitch from './LanguageSwitch'
import data from '../../data/data.json'
import CartIcon from '../cart/CartIcon'
import { useTranslation } from 'react-i18next'

const NAV = [
    { to: '/', key: 'home' },
    { to: '/products', key: 'products' },
    { to: '/order', key: 'order' },
    { to: '/about', key: 'about' },
]

// helper to resolve app name by lang
function getAppName(lang) {
    switch (lang) {
        case 'kh':
        case 'km':
            return data.APP_NAME_KH
        case 'cn':
        case 'zh':
            return data.APP_NAME_CN
        default:
            return data.APP_NAME_EN
    }
}

export default function Navbar() {
    const { t, i18n } = useTranslation()
    const { pathname } = useLocation()
    const [open, setOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    const appName = getAppName(i18n.language)

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
                background: 'linear-gradient(to bottom, #f5f1ea, #f8f4ef)',
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
            {appName}
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
                    {/* Hamburger button code stays as is */}
                </div>
            </div>
        </header>
    )
}
