import { useTranslation } from "react-i18next"
import { motion, useReducedMotion } from "framer-motion"
import { Mail, Phone, MapPin, Clock, Send, ExternalLink } from "lucide-react"
import data from "../data/data.json"

// Small helpers
const cx = (...c) => c.filter(Boolean).join(" ")
const usePrefersReducedMotion = () => useReducedMotion?.() ?? false

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

export default function Contact() {
    const { t } = useTranslation()

    // Text
    const title = t("contact.title", { defaultValue: "Contact Us" })
    const subtitle = t("contact.subtitle", { defaultValue: "Reach us any time via phone, email, or Telegram." })

    const info = {
        address: t("contact.info.address", { defaultValue: "Phnom Penh, Cambodia" }),
        phone: t("contact.info.phone", { defaultValue: "+855 12 345 678" }),
        email: t("contact.info.email", { defaultValue: "hello@example.com" }),
        hours: t("contact.info.hours", { defaultValue: "Mon–Sat, 8:00–18:00" }),
    }

    const labels = {
        address: t("contact.labels.address", { defaultValue: "Address" }),
        phone: t("contact.labels.phone", { defaultValue: "Phone" }),
        email: t("contact.labels.email", { defaultValue: "Email" }),
        hours: t("contact.labels.hours", { defaultValue: "Hours" }),
        quick: t("contact.labels.quick", { defaultValue: "Quick actions" }),
        openTelegram: t("contact.labels.open_telegram", { defaultValue: "Open Telegram" }),
        callNow: t("contact.labels.call_now", { defaultValue: "Call now" }),
        emailUs: t("contact.labels.email_us", { defaultValue: "Email us" }),
        mapTitle: t("contact.map_title", { defaultValue: "Our Location" }),
        directions: t("contact.labels.directions", { defaultValue: "Get directions" }),
    }

    // Links
    const telHref = `tel:${(info.phone || "").replace(/\s/g, "")}`
    const mailHref = `mailto:${info.email || ""}`
    const telegramUrl = data?.TELEGRAM_URL || t("contact.telegram_url", { defaultValue: "https://t.me/your_channel_or_bot" })

    // Map
    const mapEmbed =
        data?.MAP_EMBED_URL ||
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15637.2100!2d104.916!3d11.556!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3109513df8f75555%3A0x22c1f!2sPhnom%20Penh!5e0!3m2!1sen!2skh!4v1690000000000"

    const coords = data?.WAREHOUSE_COORDS
    const directionsUrl = coords?.lat && coords?.lng
        ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.address || "Phnom Penh")}`

    return (
        <section className="relative w-full bg-[var(--brand-bg)] text-[var(--brand-ink)]">
            {/* soft vignette */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: [
                        "radial-gradient(1200px 800px at 50% -10%, rgba(255,240,220,0.18), transparent 60%)",
                        "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.00))",
                    ].join(", "),
                }}
            />

            <header className="relative container mx-auto max-w-5xl px-6 pt-16 md:pt-20 pb-8">
                <FadeIn className="text-center">
                    {data?.APP_LOGO ? (
                        <img
                            src={data.APP_LOGO}
                            alt={t("contact.logo_alt", { defaultValue: "Brand logo" })}
                            className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 object-contain"
                            loading="eager"
                            decoding="async"
                        />
                    ) : null}
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{title}</h1>
                    <p className="mt-3 text-[11px] md:text-xs uppercase tracking-[0.25em] opacity-70">
                        {subtitle}
                    </p>
                </FadeIn>
            </header>

            <main className="relative container mx-auto max-w-5xl px-6 pb-16">
                {/* Contact info cards */}
                <FadeIn>
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <InfoCard icon={<MapPin className="h-5 w-5" />} heading={labels.address} body={info.address} />
                        <InfoCard icon={<Phone className="h-5 w-5" />} heading={labels.phone} body={<a className="hover:underline" href={telHref}>{info.phone}</a>} />
                        <InfoCard icon={<Mail className="h-5 w-5" />} heading={labels.email} body={<a className="hover:underline" href={mailHref}>{info.email}</a>} />
                        <InfoCard icon={<Clock className="h-5 w-5" />} heading={labels.hours} body={info.hours} />
                    </section>
                </FadeIn>

                {/* Main: Quick actions + Map (no form, no QR) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Quick Actions */}
                    <FadeIn>
                        <section className="rounded-2xl border border-white/15 bg-white/[0.055] p-6">
                            <h2 className="text-lg md:text-xl font-semibold mb-4">{labels.quick}</h2>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <a
                                    href={telegramUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold bg-[var(--brand-ink)] text-[var(--brand-bg)] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand-ink)] focus-visible:ring-offset-[var(--brand-bg)]"
                                >
                                    <Send className="h-4 w-4" />
                                    {labels.openTelegram}
                                    <ExternalLink className="h-4 w-4 opacity-70" />
                                </a>

                                <a
                                    href={telHref}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold border border-white/20 hover:border-white/40"
                                >
                                    <Phone className="h-4 w-4" />
                                    {labels.callNow}
                                </a>

                                <a
                                    href={mailHref}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold border border-white/20 hover:border-white/40"
                                >
                                    <Mail className="h-4 w-4" />
                                    {labels.emailUs}
                                </a>
                            </div>
                        </section>
                    </FadeIn>

                    {/* Right: Map with Directions */}
                    <FadeIn delay={0.05}>
                        <section className="rounded-2xl overflow-hidden border border-white/15 bg-white/[0.055]">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                                <h3 className="text-base font-semibold">{labels.mapTitle}</h3>
                                <a
                                    href={directionsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold border border-white/20 hover:border-white/40"
                                >
                                    <MapPin className="h-4 w-4" />
                                    {labels.directions}
                                    <ExternalLink className="h-4 w-4 opacity-70" />
                                </a>
                            </div>
                            <iframe
                                title={labels.mapTitle}
                                src={mapEmbed}
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="w-full h-[360px] md:h-[520px] block"
                            />
                        </section>
                    </FadeIn>
                </div>
            </main>
        </section>
    )
}

function InfoCard({ icon, heading, body }) {
    return (
        <div className="rounded-2xl border border-white/15 bg-white/[0.055] p-4">
            <div className="flex items-center gap-2 mb-1 opacity-90">
                {icon}
                <div className="font-semibold">{heading}</div>
            </div>
            <div className="opacity-90">{body}</div>
        </div>
    )
}
