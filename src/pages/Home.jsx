import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import data from "../data/data.json"
import ScrollSection from "../components/animate/ScrollSection.jsx"

export default function Home() {
    const { t } = useTranslation()
    const { HOME_IMAGES } = data

    return (
        <>
            {/* Hero */}
            <section className="relative h-screen flex items-center justify-center text-center bg-[var(--brand-bg)] overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="z-10 space-y-6"
                >
                    <h1 className="text-5xl md:text-6xl font-bold max-w-3xl mx-auto leading-tight text-[var(--brand-ink)]">
                        {t("home.heroTitle")}
                    </h1>
                    <Link
                        className="bg-[var(--brand-accent)] text-white px-8 py-4 rounded-xl shadow-lg hover:scale-105 transition"
                        to="/products"
                    >
                        {t("home.cta")}
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className={`absolute inset-0 bg-[url('${HOME_IMAGES.hero}')] bg-cover bg-center scale-110`}
                />
            </section>

            {/* Sections */}
            <ScrollSection
                title={t("home.sections.farm.title")}
                subtitle={t("home.sections.farm.subtitle")}
                image={HOME_IMAGES.farm}
            />
            <ScrollSection
                title={t("home.sections.brew.title")}
                subtitle={t("home.sections.brew.subtitle")}
                image={HOME_IMAGES.brew}
                reverse
            />
            <ScrollSection
                title={t("home.sections.featured.title")}
                subtitle={t("home.sections.featured.subtitle")}
                image={HOME_IMAGES.featured}
                cta={{ to: "/products", label: t("home.cta") }}
            />
        </>
    )
}
