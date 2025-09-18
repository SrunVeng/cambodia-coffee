import React, { useMemo } from "react"
import data from "../../data/data.json"
import { useTranslation } from "react-i18next"
import { Facebook, Instagram, Send, MessageCircle } from "lucide-react"

function normalizeLang(lng) {
    return (lng || "EN").split("-")[0].toUpperCase()
}

export default function Footer() {
    const { t, i18n } = useTranslation()

    const appName = useMemo(() => {
        const L = normalizeLang(i18n.resolvedLanguage || i18n.language)
        const nameByLang = {
            EN: data.APP_NAME_EN,
            KH: data.APP_NAME_KH,
            CN: data.APP_NAME_CN ?? data.APP_NAME_EN,
        }
        return nameByLang[L] || data.APP_NAME_EN
    }, [i18n.resolvedLanguage, i18n.language])

    return (
        <footer className="border-t border-[var(--ring)] bg-[var(--brand-bg)] text-[var(--brand-ink)]">
            <div className="container-narrow py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Left: Logo + Copyright */}
                <div className="flex items-center gap-3">
                    <img
                        src={data.APP_LOGO}
                        alt="logo"
                        className="h-8 w-8 rounded-lg bg-white shadow-sm ring-1 ring-[var(--ring)] object-cover"
                    />
                    <span className="text-sm opacity-80">
            © {new Date().getFullYear()} {appName}
          </span>
                </div>

                {/* Right: Social links */}
                <div className="flex gap-6 text-sm font-medium">
                    <a
                        href={data.SOCIAL.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-[var(--brand-accent)] transition"
                    >
                        <Facebook className="w-5 h-5" />
                        {t("footer.facebook")}
                    </a>
                    <a
                        href={data.SOCIAL.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-[var(--brand-accent)] transition"
                    >
                        <Instagram className="w-5 h-5" />
                        {t("footer.instagram")}
                    </a>
                    <a
                        href={data.SOCIAL.wechat}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-[var(--brand-accent)] transition"
                    >
                        <MessageCircle className="w-5 h-5" />
                        {t("footer.wechat")}
                    </a>
                    <a
                        href={data.SOCIAL.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-[var(--brand-accent)] transition"
                    >
                        <Send className="w-5 h-5" />
                        {t("footer.telegram")}
                    </a>
                </div>
            </div>
        </footer>
    )
}
