import { motion as Motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import data from "../../data/data.json";

const QR_DATA = data.QR_CODES || [];

const CONTAINER_VARIANTS = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.08 },
    },
};

const getItemVariants = (prefersReducedMotion) => ({
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: prefersReducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 220, damping: 20 },
    },
});

export default function ContactPaymentQr() {
    const { t } = useTranslation();
    const prefersReducedMotion = useReducedMotion();
    const item = getItemVariants(prefersReducedMotion);

    return (
        <section className="min-h-screen bg-[var(--brand-bg)] px-6 py-16 flex items-center justify-center">
            <div className="w-full max-w-4xl">

                {/* HEADER */}
                <Motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-3xl md:text-5xl font-bold text-[#2d1a14]">
                        {t("contactOrder.title")}
                    </h1>

                    <p className="mt-2 text-sm md:text-base text-[#7a6658]">
                        {t("contactOrder.subtitle")}
                    </p>

                    {/* PHONE CARD */}
                    <div className="mt-6 flex justify-center">
                        <a
                            href="tel:+85586252502"
                            className="flex items-center gap-4 px-5 py-3 rounded-2xl
                                       bg-white/70 border border-[#e7dbc9]
                                       backdrop-blur shadow-sm
                                       hover:bg-white transition"
                        >
                            <div className="w-9 h-9 rounded-full bg-[#2d1a14] text-white flex items-center justify-center text-xs font-bold">
                                ☎
                            </div>

                            <div className="text-left">
                                <p className="text-[11px] uppercase tracking-wider text-[#8a7768]">
                                    {t("contactOrder.call_us")}
                                </p>
                                <p className="text-[#2d1a14] font-semibold">
                                    +855 86 252 502
                                </p>
                            </div>
                        </a>
                    </div>
                </Motion.div>

                {/* QR GRID */}
                <Motion.div
                    variants={CONTAINER_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                >
                    {QR_DATA.map((qr) => (
                        <Motion.a
                            key={qr.key}
                            variants={item}
                            href={qr.link}
                            target="_blank"
                            rel="noreferrer"
                            className="
                                group relative
                                bg-white/60
                                border border-[#e7dbc9]
                                rounded-2xl
                                p-6
                                flex flex-col items-center text-center
                                hover:bg-white hover:shadow-md
                                transition
                            "
                        >
                            {/* hover glow */}
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition bg-gradient-to-b from-white/40 to-transparent" />

                            {/* QR IMAGE */}
                            <div className="relative w-36 h-36 flex items-center justify-center">
                                <img
                                    src={qr.imageUrl}
                                    alt={t(`contactOrder.qr.${qr.key}`)}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-contain p-2"
                                />
                            </div>

                            {/* LABEL */}
                            <h3 className="mt-4 text-[#2d1a14] font-medium">
                                {t(`contactOrder.qr.${qr.key}`)}
                            </h3>

                            {/* HINT */}
                            <p className="text-xs text-[#8a7768] mt-1">
                                {t("contactOrder.tap_hint")}
                            </p>
                        </Motion.a>
                    ))}
                </Motion.div>
            </div>
        </section>
    );
}
