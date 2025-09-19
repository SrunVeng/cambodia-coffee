// src/pages/About.jsx
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { motion, useReducedMotion } from "framer-motion"
import data from "../data/data.json"

// ----------------- SHARED GALLERY (moved out of i18n) -----------------
const GALLERY = [
    "https://weaverscoffee.com/cdn/shop/articles/Roasted_coffee_beans_turning_in_a_cooling_tray_of_a_45_kilo_Probat_coffee_roaster_1000x.jpg?v=1696029182",
    "https://cdn.shopify.com/s/files/1/0187/0338/files/closeup_of_roastd_coffee_coming_out_of_75_kilo_probat.jpg?v=1623941252",
    "https://media.istockphoto.com/id/1479788163/photo/pouring-coffee-beans-to-cooler-from-coffee-roasting-machine.jpg?s=612x612&w=0&k=20&c=5kfzlpg1L04QiKMzleewebLf7YeDoLqVLyFiRuWzfro=",
    "https://media.istockphoto.com/id/1333323947/photo/asian-senior-man-craftsperson-observing-freshly-roasted-coffee-beans-being-removed-from-the.jpg?s=612x612&w=0&k=20&c=GvGSEbSEzt4xMqgGqkFcbGvUveVSRDnWzNQhOyIol_k=",
    "https://library.sweetmarias.com/wp-content/uploads/2024/09/brazil-sweet-marias-coffee-bom-dia-brazil-27.jpg",
    "https://www.nespresso.com/shared_res/agility/coffeeCommunicationPlatform/coffeeCommunicationPlatform/img/9/listicle_farmers_L.jpg",
    "/images/gallery/cupping-1.jpg",
    "/images/gallery/warehouse-1.jpg",
    "/images/gallery/cafe-2.jpg",
    "/images/gallery/roast-3.jpg"
]


// ----------------- helpers -----------------
const usePrefersReducedMotion = () => useReducedMotion?.() ?? false
const cx = (...c) => c.filter(Boolean).join(" ")

function toArray(maybeList) {
    if (Array.isArray(maybeList)) return maybeList
    if (!maybeList) return []
    if (typeof maybeList === "string")
        return maybeList.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
    if (typeof maybeList === "object")
        return Object.values(maybeList).map(String).filter(Boolean)
    return []
}

function FadeIn({ delay = 0, children, className = "" }) {
    const reduce = usePrefersReducedMotion()
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
            whileInView={reduce ? {} : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 0.55, ease: "easeOut", delay }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

function Divider({ className = "" }) {
    return (
        <div className={cx("my-12 flex items-center justify-center", className)}>
            <i className="h-px w-24 bg-white/15" />
            <span className="mx-3 text-[10px] tracking-[0.3em] uppercase opacity-60">• • •</span>
            <i className="h-px w-24 bg-white/15" />
        </div>
    )
}

// ----------------- page surface (vintage but minimal) -----------------
const paperBg = {
    backgroundImage: [
        "radial-gradient(1200px 800px at 50% -10%, rgba(255,240,220,0.18), transparent 60%)",
        "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.00))",
    ].join(", "),
}
const filmGrain = {
    backgroundImage:
        "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0 1px, transparent 1px 2px)",
    opacity: 0.25,
    mixBlendMode: "soft-light",
    pointerEvents: "none",
}

// Latte / cream tone for bullets (adjust if needed)
const BULLET_COLOR = "#E7D9C9" // creamy-latte
// Optional deeper latte: const BULLET_COLOR = "#DCC4A1"

// ----------------- Lightbox -----------------
function Lightbox({ open, src, alt, onClose }) {
    useEffect(() => {
        if (!open) return
        const onKey = (e) => e.key === "Escape" && onClose?.()
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open, onClose])
    if (!open) return null
    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
        >
            <img
                src={src}
                alt={alt}
                className="max-h-[90vh] max-w-[92vw] rounded-xl border border-white/10 shadow-2xl object-contain"
            />
        </div>
    )
}

// ----------------- Touch swipe (mobile) with click guard -----------------
function useTouchSwipeScroll(ref, { preventClickRef, threshold = 6 } = {}) {
    useEffect(() => {
        const el = ref.current
        if (!el) return

        let startX = 0, startY = 0, startScroll = 0

        const onTouchStart = (e) => {
            const t = e.touches[0]
            startX = t.clientX
            startY = t.clientY
            startScroll = el.scrollLeft
            if (preventClickRef) preventClickRef.current = false
        }

        const onTouchMove = (e) => {
            const t = e.touches[0]
            const dx = t.clientX - startX
            const dy = t.clientY - startY

            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
                if (preventClickRef) preventClickRef.current = true
                el.scrollLeft = startScroll - dx
                e.preventDefault()
            }
        }

        const onTouchEnd = () => {
            if (preventClickRef) {
                const r = preventClickRef
                setTimeout(() => { r.current = false }, 60)
            }
        }

        el.addEventListener("touchstart", onTouchStart, { passive: true })
        el.addEventListener("touchmove", onTouchMove, { passive: false })
        el.addEventListener("touchend", onTouchEnd)

        return () => {
            el.removeEventListener("touchstart", onTouchStart)
            el.removeEventListener("touchmove", onTouchMove)
            el.removeEventListener("touchend", onTouchEnd)
        }
    }, [ref, preventClickRef, threshold])
}

// ----------------- Desktop kinetic drag (mouse only) -----------------
function useMouseKineticScroll(ref, { friction = 0.94, minVelocity = 0.3 } = {}) {
    useEffect(() => {
        const el = ref.current
        if (!el) return
        let isDown = false,
            startX = 0,
            scrollStart = 0,
            lastX = 0,
            lastT = 0,
            vx = 0,
            raf

        const onPointerDown = (e) => {
            if (e.pointerType !== "mouse" || e.button !== 0) return
            isDown = true
            el.setPointerCapture?.(e.pointerId)
            el.classList.add("cursor-grabbing")
            startX = e.clientX
            scrollStart = el.scrollLeft
            lastX = e.clientX
            lastT = performance.now()
            vx = 0
            cancelAnimationFrame(raf)
        }
        const onPointerMove = (e) => {
            if (!isDown) return
            e.preventDefault()
            const x = e.clientX
            const dx = x - startX
            el.scrollLeft = scrollStart - dx
            const now = performance.now()
            const dt = Math.max(1, now - lastT)
            vx = 0.8 * vx + 0.2 * ((x - lastX) / dt) * 16
            lastX = x
            lastT = now
        }
        const animate = () => {
            if (Math.abs(vx) < minVelocity) return
            el.scrollLeft -= vx
            vx *= friction
            raf = requestAnimationFrame(animate)
        }
        const onPointerUp = (e) => {
            if (!isDown) return
            isDown = false
            el.releasePointerCapture?.(e.pointerId)
            el.classList.remove("cursor-grabbing")
            raf = requestAnimationFrame(animate)
        }

        el.addEventListener("pointerdown", onPointerDown, { passive: true })
        el.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)
        return () => {
            el.removeEventListener("pointerdown", onPointerDown)
            el.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
            cancelAnimationFrame(raf)
        }
    }, [ref, friction, minVelocity])
}

// ----------------- image with graceful fallback -----------------
function ImgWithFallback({ src, alt = "" }) {
    const [ok, setOk] = useState(true)
    return ok ? (
        <img
            src={src}
            alt={alt}
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 60vw, 30vw"
            onError={() => setOk(false)}
        />
    ) : (
        <div className="aspect-[4/3] w-full flex items-center justify-center text-sm opacity-75">
            {alt || "Image unavailable"}
        </div>
    )
}

// ----------------- main -----------------
export default function About() {
    const { t } = useTranslation()

    // i18n content
    const mission = t("about.mission")
    const core = toArray(t("about.core", { returnObjects: true }))
    const valuesRaw = t("about.values", { returnObjects: true })
    const values = Array.isArray(valuesRaw) ? valuesRaw : []
    const processRaw = t("about.process", { returnObjects: true })
    const process = Array.isArray(processRaw) ? processRaw : []
    const roast = t("about.roast", { returnObjects: true }) || {}
    const heritage = t("about.heritage", { returnObjects: true }) || {}

    // GALLERY from constant (not i18n)
    const gallery = useMemo(() => GALLERY.map(src => ({ src })), [])
    const gallerySlim = useMemo(() => gallery.slice(0, 6), [gallery])

    const contactHref = t("about.contact_href", { defaultValue: "/contact" })
    const contactLabel = t("about.contact_label", { defaultValue: "Contact us" })
    const slogan = t("about.slogan_primary", {
        defaultValue: "Made in Cambodia, Shared with the World.",
    })

    const labels = {
        mission: t("about.labels.mission", { defaultValue: "Mission" }),
        core: t("about.labels.core", { defaultValue: "Core" }),
        values: t("about.labels.values", { defaultValue: "Values" }),
        roast: t("about.labels.roast", { defaultValue: "Roast" }),
        process: t("about.labels.process", { defaultValue: "Process" }),
        gallery: t("about.labels.gallery", { defaultValue: "Gallery" }),
        heritageYears: t("about.labels.heritage", { defaultValue: "Years Roasting" }),
        team: t("about.labels.team", { defaultValue: "Team Members" }),
        freshness: t("about.labels.freshness", { defaultValue: "Days to Shelf" }),
        inventory: t("about.labels.inventory", { defaultValue: "Months of Green" }),
        heritageBlock: t("about.labels.heritage_block", { defaultValue: "Our Heritage" }),
    }

    // lightbox
    const [lightbox, setLightbox] = useState({ open: false, src: "", alt: "" })

    // gallery state & interactions
    const trackRef = useRef(null)
    const cardRefs = useRef([])
    const [active, setActive] = useState(0)
    const dragBlockClickRef = useRef(false)

    useMouseKineticScroll(trackRef) // desktop drag inertia
    useTouchSwipeScroll(trackRef, { preventClickRef: dragBlockClickRef }) // mobile swipe

    // active dot via IntersectionObserver
    useEffect(() => {
        const root = trackRef.current
        if (!root) return
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        const idx = Number(e.target.getAttribute("data-idx"))
                        if (!Number.isNaN(idx)) setActive(idx)
                    }
                })
            },
            { root, threshold: 0.6 }
        )
        cardRefs.current.forEach((el) => el && io.observe(el))
        return () => io.disconnect()
    }, [gallerySlim.length])

    const scrollTo = (i) => {
        const el = cardRefs.current[i]
        if (el) el.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" })
    }
    const scrollStep = (dir = 1) => {
        const root = trackRef.current
        if (!root) return
        const child = cardRefs.current[active]
        const w = child ? child.clientWidth : 280
        root.scrollBy({ left: dir * (w + 24), behavior: "smooth" })
    }

    return (
        <section
            className="relative w-full bg-[var(--brand-bg)] text-[var(--brand-ink)]"
            style={paperBg}
        >
            <div className="pointer-events-none absolute inset-0" style={filmGrain} />

            {/* HERO */}
            <header className="relative container mx-auto max-w-5xl px-6 pt-16 md:pt-20 pb-10 md:pb-12">
                <FadeIn className="text-center">
                    {/* Logo */}
                    <img
                        src={data.APP_LOGO}
                        alt={t("about.logo_alt", { defaultValue: "Cambodia Coffee Logo" })}
                        className="w-16 h-16 md:w-20 md:h-20 object-contain mx-auto mb-4"
                        loading="eager"
                        decoding="async"
                    />

                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                        {t("about.title", { defaultValue: "About Us" })}
                    </h1>

                    <p className="mt-2 text-[11px] md:text-xs uppercase tracking-[0.25em] opacity-70">
                        {slogan}
                    </p>


                    <p className="mt-4 text-base md:text-lg opacity-85">
                        {t("about.tagline", { defaultValue: "Heritage coffee, roasted with care." })}
                    </p>

                    <p className="mt-4 text-lg opacity-90 max-w-3xl mx-auto">
                        {t("about.story", {
                            defaultValue:
                                "We roast in small batches, honor Khmer craft, and deliver cups that feel like home.",
                        })}
                    </p>
                </FadeIn>
            </header>

            {/* CONTENT */}
            <main className="relative container mx-auto max-w-5xl px-6 pb-16">
                {/* Heritage */}
                {heritage?.body && (
                    <>
                        <Divider className="my-10" />
                        <FadeIn>
                            <section className="rounded-2xl border border-white/15 bg-white/[0.055] p-6">
                                <h2 className="text-lg md:text-xl font-semibold mb-2">
                                    {labels.heritageBlock}
                                </h2>
                                <p className="opacity-90">{heritage.body}</p>
                                {heritage?.note && (
                                    <p className="mt-3 text-sm opacity-70 italic">— {heritage.note}</p>
                                )}
                            </section>
                        </FadeIn>
                    </>
                )}

                {/* Mission */}
                {mission && (
                    <>
                        <Divider className="my-10" />
                        <FadeIn>
                            <section className="rounded-2xl border border-white/15 bg-white/[0.055] p-6">
                                <h2 className="text-lg md:text-xl font-semibold mb-2">{labels.mission}</h2>
                                <p className="opacity-90">{mission}</p>
                            </section>
                        </FadeIn>
                    </>
                )}

                {/* Core & Values */}
                {core.length || values.length ? (
                    <>
                        <Divider />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {!!core.length && (
                                <FadeIn>
                                    <section className="rounded-2xl border border-white/15 bg-white/[0.055] p-6 h-full">
                                        <h2 className="text-lg md:text-xl font-semibold mb-3">{labels.core}</h2>
                                        <ul className="space-y-2 opacity-95">
                                            {core.map((c, i) => (
                                                <li key={i} className="flex items-start gap-3 font-semibold">
                          <span
                              className="mt-2 h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: BULLET_COLOR }}
                          />
                                                    <span>{c}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                </FadeIn>
                            )}
                            {!!values.length && (
                                <FadeIn delay={0.05}>
                                    <section className="rounded-2xl border border-white/15 bg-white/[0.055] p-6 h-full">
                                        <h2 className="text-lg md:text-xl font-semibold mb-3">{labels.values}</h2>
                                        <ul className="space-y-3 opacity-95">
                                            {values.map((v, i) => (
                                                <li key={i} className="flex items-start gap-3">
                          <span
                              className="mt-2 h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: BULLET_COLOR }}
                          />
                                                    <div>
                                                        <div className="font-semibold">{v?.title || ""}</div>
                                                        {v?.body && <p className="opacity-85">{v.body}</p>}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                </FadeIn>
                            )}
                        </div>
                    </>
                ) : null}

                {/* Roast */}
                {(roast?.title || roast?.intro || (roast?.highlights || []).length) && (
                    <>
                        <Divider />
                        <FadeIn>
                            <section>
                                <h2 className="text-lg md:text-xl font-semibold mb-2">
                                    {roast?.title || t("about.roast.title", { defaultValue: "Our Roast" })}
                                </h2>
                                {roast?.intro && <p className="opacity-90 mb-4">{roast.intro}</p>}
                                <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {(roast?.highlights || []).map((h, i) => (
                                        <li
                                            key={i}
                                            className="rounded-xl border border-white/15 bg-white/[0.055] p-4"
                                        >
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </FadeIn>
                    </>
                )}

                {/* Process */}
                {!!process.length && (
                    <>
                        <Divider />
                        <FadeIn>
                            <section>
                                <h2 className="text-lg md:text-xl font-semibold mb-4">{labels.process}</h2>
                                <ol className="relative border-l border-white/20 pl-5">
                                    {process.map((step, i) => (
                                        <li key={i} className="mb-5 ml-2">
                                            <span className="absolute -left-[9px] mt-1 h-4 w-4 rounded-full border border-white/40 bg-[var(--brand-bg)]" />
                                            <div className="font-medium">
                                                {step?.title ||
                                                    t("about.step_title_fallback", { defaultValue: "Step" })}
                                            </div>
                                            <p className="opacity-85">
                                                {step?.body || (typeof step === "string" ? step : "")}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        </FadeIn>
                    </>
                )}

                {/* GALLERY */}
                {!!gallerySlim.length && (
                    <>
                        <Divider />
                        <FadeIn>
                            <section>
                                <h2 className="text-lg md:text-xl font-semibold mb-4">{labels.gallery}</h2>

                                <div className="relative -mx-6">
                                    {/* edge fades */}
                                    <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[var(--brand-bg)] to-transparent" />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--brand-bg)] to-transparent" />

                                    {/* arrows (desktop) */}
                                    <button
                                        onClick={() => scrollStep(-1)}
                                        className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur hover:bg-white/20"
                                        aria-label="Previous image"
                                    >
                                        ‹
                                    </button>
                                    <button
                                        onClick={() => scrollStep(1)}
                                        className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur hover:bg-white/20"
                                        aria-label="Next image"
                                    >
                                        ›
                                    </button>

                                    {/* track */}
                                    <div
                                        ref={trackRef}
                                        className={cx(
                                            "flex gap-6 overflow-x-auto pb-3 px-6 snap-x snap-mandatory cursor-grab",
                                            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none",
                                            "scroll-smooth"
                                        )}
                                        style={{
                                            WebkitOverflowScrolling: "touch",
                                            touchAction: "pan-y",
                                            overscrollBehaviorX: "contain",
                                            scrollSnapType: "x mandatory",
                                        }}
                                        role="region"
                                        aria-label="About gallery"
                                    >
                                        {gallerySlim.map((g, i) => (
                                            <button
                                                key={g.src + i}
                                                ref={(el) => (cardRefs.current[i] = el)}
                                                data-idx={i}
                                                onClick={() => {
                                                    if (dragBlockClickRef.current) return
                                                    setLightbox({
                                                        open: true,
                                                        src: g.src,
                                                        alt: t("about.gallery_alt", { defaultValue: "Gallery image" }),
                                                    })
                                                }}
                                                className={cx(
                                                    "relative shrink-0 w-[15.5rem] md:w-[19rem] snap-center transition-transform duration-500 group",
                                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                                                    "hover:scale-[1.015]"
                                                )}
                                                aria-label={t("about.gallery_open", { defaultValue: "Open image" })}
                                            >
                                                <ImgWithFallback
                                                    src={g.src}
                                                    alt={t("about.gallery_alt", { defaultValue: "Gallery image" })}
                                                />
                                                {/* subtle ring + soft drop for vintage vibe */}
                                                <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/10" />
                                                <span className="pointer-events-none absolute -bottom-2 left-6 right-6 h-4 rounded-full blur-md bg-black/30 opacity-35" />
                                            </button>
                                        ))}
                                    </div>

                                    {/* dots */}
                                    <div className="mt-5 flex justify-center gap-2">
                                        {gallerySlim.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => scrollTo(i)}
                                                className={cx(
                                                    "h-1.5 w-1.5 rounded-full transition-opacity",
                                                    i === active
                                                        ? "opacity-90 bg-[var(--brand-ink)]"
                                                        : "opacity-40 bg-[var(--brand-ink)]/60"
                                                )}
                                                aria-label={`Go to image ${i + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <Lightbox
                                    open={lightbox.open}
                                    src={lightbox.src}
                                    alt={lightbox.alt}
                                    onClose={() => setLightbox({ open: false, src: "", alt: "" })}
                                />
                            </section>
                        </FadeIn>
                    </>
                )}

                {/* CTA */}
                <Divider />
                <FadeIn className="text-center">
                    <a
                        href={contactHref}
                        className="inline-block rounded-xl px-6 py-3 font-semibold bg-[var(--brand-ink)] text-[var(--brand-bg)] hover:opacity-90 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand-ink)] focus-visible:ring-offset-[var(--brand-bg)]"
                    >
                        {contactLabel}
                    </a>
                    <p className="sr-only">
                        {t("about.cta_sr_hint", { defaultValue: "Go to contact page" })}
                    </p>
                </FadeIn>
            </main>
        </section>
    )
}
