import { useEffect, useState, useCallback } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import LanguageSwitch from "./LanguageSwitch"
import data from "../../data/data.json"
import CartIcon from "../cart/CartIcon"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "framer-motion"

const NAV = [
    { to: "/", key: "home" },
    { to: "/products", key: "products" },
    { to: "/order", key: "order" },
    { to: "/about", key: "about" },
]

function getAppName(lang) {
    switch (lang) {
        case "kh":
        case "km":
            return data.APP_NAME_KH
        case "cn":
        case "zh":
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

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 6)
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    useEffect(() => { setOpen(false) }, [pathname])

    useEffect(() => {
        const cls = "overflow-hidden"
        if (open) document.body.classList.add(cls)
        else document.body.classList.remove(cls)
        return () => document.body.classList.remove(cls)
    }, [open])

    const onKeyDown = useCallback((e) => { if (e.key === "Escape") setOpen(false) }, [])
    useEffect(() => {
        if (!open) return
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [open, onKeyDown])

    useEffect(() => {
        const onResize = () => {
            if (window.matchMedia("(min-width:768px)").matches) setOpen(false)
        }
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 border-b border-[var(--ring)]
                  transition-[height,box-shadow] duration-300
                  ${scrolled ? "h-14 shadow-md" : "h-16 shadow-sm"}`}
            style={{ background: "linear-gradient(to right, #f5f1ea, #f8f4ef)" }}
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
                <nav className="hidden md:flex items-center gap-3 lg:gap-4 xl:gap-5">
                    {NAV.map(({ to, key }) => (
                        <NavLink
                            key={key}
                            to={to}
                            end
                            className={({ isActive }) =>
                                `group relative px-1 text-[13px] md:text-sm leading-5 tracking-tight
                 opacity-85 hover:opacity-100 transition whitespace-nowrap
                 ${isActive ? "active opacity-100 font-semibold text-[var(--brand-accent)]" : ""}`
                            }
                        >
                            {t(`nav.${key}`)}
                            <span
                                className="pointer-events-none absolute left-0 -bottom-1 h-0.5 w-0 rounded-full
                           bg-[var(--brand-accent)] transition-[width] duration-300 group-hover:w-full"
                            />
                        </NavLink>
                    ))}
                </nav>

                {/* Desktop actions */}
                <div className="hidden md:flex items-center gap-2">
                    <div
                        className={open ? "pointer-events-none opacity-50" : ""}
                        aria-disabled={open ? "true" : undefined}
                        title={open ? t("common.disabled", { defaultValue: "Disabled while menu is open" }) : undefined}
                    >
                        <LanguageSwitch key={open ? "ls-disabled" : "ls-enabled"} disabled={open} />
                    </div>

                    {/* ❗ CartIcon already contains its own link – do NOT wrap it in <Link> */}
                    <CartIcon active={pathname === "/order"} />
                </div>

                {/* Mobile actions */}
                <div className="md:hidden flex items-center gap-2">
                    <div
                        className={open ? "pointer-events-none opacity-50" : ""}
                        aria-disabled={open ? "true" : undefined}
                        title={open ? t("common.disabled", { defaultValue: "Disabled while menu is open" }) : undefined}
                    >
                        <LanguageSwitch key={open ? "lsm-disabled" : "lsm-enabled"} disabled={open} />
                    </div>

                    {/* ❗ Same here – render only the CartIcon */}
                    <CartIcon active={pathname === "/order"} />

                    {/* Animated Hamburger Button */}
                    <button
                        aria-label={open ? "Close menu" : "Open menu"}
                        onClick={() => setOpen((v) => !v)}
                        className="relative w-8 h-8 flex flex-col justify-center items-center"
                    >
                        <motion.span
                            initial={false}
                            animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="block w-6 h-0.5 bg-black rounded"
                        />
                        <motion.span
                            initial={false}
                            animate={open ? { opacity: 0 } : { opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="block w-6 h-0.5 bg-black rounded my-1"
                        />
                        <motion.span
                            initial={false}
                            animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="block w-6 h-0.5 bg-black rounded"
                        />
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            key="overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="md:hidden fixed left-0 right-0 bottom-0 z-40 bg-black/30 backdrop-blur-md"
                            style={{ top: scrolled ? "56px" : "64px" }}
                            onClick={() => setOpen(false)}
                        />

                        <motion.div
                            key="drawer"
                            initial={{ y: -40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -30, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 260, damping: 22 }}
                            className="md:hidden absolute top-full left-0 right-0 z-50
                         rounded-b-2xl shadow-2xl overflow-hidden
                         bg-[var(--brand-bg)] border-b border-[var(--ring)]"
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.08 }}
                                transition={{ duration: 0.6 }}
                                style={{ backgroundImage: `url(${data.NavBackground})` }}
                                className="absolute inset-0 bg-cover bg-center"
                            />

                            <motion.nav
                                className="relative flex flex-col px-4 py-2 z-10"
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
                            >
                                {NAV.map(({ to, key }, idx) => (
                                    <motion.div
                                        key={key}
                                        variants={{ hidden: { y: 15, opacity: 0 }, show: { y: 0, opacity: 1, transition: { ease: "easeOut" } } }}
                                        whileTap={{ scale: 0.985 }}
                                    >
                                        <NavLink
                                            to={to}
                                            end
                                            className={({ isActive }) =>
                                                [
                                                    "group relative block rounded-lg px-4 py-3 transition-colors outline-none",
                                                    "hover:bg-[var(--brand-ink)]/5 active:bg-[var(--brand-ink)]/10",
                                                    "focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]/40",
                                                    isActive
                                                        ? "active bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-semibold ring-1 ring-[var(--brand-accent)]/30"
                                                        : "text-[var(--brand-ink)] opacity-85 hover:opacity-100",
                                                ].join(" ")
                                            }
                                        >
                      <span className="flex items-center gap-3">
                        <span className="flex-1">{t(`nav.${key}`)}</span>
                      </span>
                                        </NavLink>

                                        {idx < NAV.length - 1 && (
                                            <div aria-hidden className="px-2">
                                                <div className="h-px bg-[var(--ring)]/60" />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </motion.nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    )
}
