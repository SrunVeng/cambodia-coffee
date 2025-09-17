import { useTranslation } from "react-i18next"
import logo from "../assets/logo.png" // <- update path to your logo

export default function About() {
    const { t } = useTranslation()

    return (
        <section className="w-full bg-[var(--brand-bg)] text-[var(--brand-ink)] py-20">
            <div className="container mx-auto max-w-3xl px-6 text-center">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <img
                        src={logo}
                        alt="Coffee Brand Logo"
                        className="w-24 h-24 md:w-32 md:h-32 object-contain"
                    />
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    {t("about.title")}
                </h2>

                {/* Story */}
                <p className="text-lg leading-relaxed opacity-90">
                    {t("about.story")}
                </p>
            </div>
        </section>
    )
}
