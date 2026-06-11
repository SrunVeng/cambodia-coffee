// src/pages/About.jsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion as Motion, useReducedMotion } from "framer-motion";
import data from "../data/data.json";

// ----------------- helpers -----------------
const cx = (...c) => c.filter(Boolean).join(" ");
const toArray = (maybe) => {
    if (Array.isArray(maybe)) return maybe;
    if (!maybe) return [];
    if (typeof maybe === "string")
        return maybe.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    if (typeof maybe === "object")
        return Object.values(maybe).map(String).filter(Boolean);
    return [];
};

const yearsSince = (year) =>
    Math.max(0, new Date().getFullYear() - year);

function FadeIn({ delay = 0, children, className = "" }) {
    const reduce = useReducedMotion();
    return (
        <Motion.div
            initial={reduce ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
            whileInView={reduce ? {} : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 0.55, ease: "easeOut", delay }}
            className={className}
        >
            {children}
        </Motion.div>
    );
}

function Divider({ className = "" }) {
    return (
        <div className={cx("my-12 flex items-center justify-center", className)} aria-hidden="true">
            <i className="h-px w-24 bg-white/15" />
            <span className="mx-3 text-[10px] tracking-[0.3em] uppercase opacity-60 select-none">
                • • •
            </span>
            <i className="h-px w-24 bg-white/15" />
        </div>
    );
}

// ----------------- page styling -----------------
const paperBg = {
    backgroundImage: [
        "radial-gradient(1200px 800px at 50% -10%, rgba(255,240,220,0.18), transparent 60%)",
        "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.00))"
    ].join(", ")
};

const filmGrain = {
    backgroundImage:
        "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0 1px, transparent 1px 2px)",
    opacity: 0.25,
    mixBlendMode: "soft-light",
    pointerEvents: "none"
};

// ----------------- MAIN -----------------
export default function About() {
    const { t } = useTranslation();

    const mission = t("about.mission");
    const core = toArray(t("about.core", { returnObjects: true }));
    const valuesRaw = t("about.values", { returnObjects: true });
    const values = Array.isArray(valuesRaw) ? valuesRaw : [];
    const processRaw = t("about.process", { returnObjects: true });
    const process = Array.isArray(processRaw) ? processRaw : [];
    const roast = t("about.roast", { returnObjects: true }) || {};
    const heritage = t("about.heritage", { returnObjects: true }) || {};

    const contactHref = t("about.contact_href", { defaultValue: "/Contact" });
    const contactLabel = t("about.contact_label", { defaultValue: "Contact us" });

    const labels = {
        mission: t("about.labels.mission", { defaultValue: "Mission" }),
        core: t("about.labels.core", { defaultValue: "Core" }),
        values: t("about.labels.values", { defaultValue: "Values" }),
        roast: t("about.labels.roast", { defaultValue: "Roast" }),
        process: t("about.labels.process", { defaultValue: "Process" }),
        heritageYears: t("about.labels.heritage", { defaultValue: "Years Roasting" }),
        heritageBlock: t("about.labels.heritage_block", { defaultValue: "Our Heritage" })
    };

    const foundedYear = data?.FOUNDED_YEAR ?? 1990;
    const years = yearsSince(foundedYear);
    const yearsLocalized = t("units.years", { count: years });

    return (
        <section
            className="relative w-full bg-[var(--brand-bg)] text-[var(--brand-ink)]"
            style={paperBg}
        >
            <div className="pointer-events-none absolute inset-0" style={filmGrain} />

            {/* HERO */}
            <header className="container mx-auto max-w-5xl px-6 pt-16 pb-10 text-center">
                <FadeIn>
                    <img
                        src={data.APP_LOGO}
                        alt="Logo"
                        className="w-16 h-16 mx-auto mb-4 object-contain"
                        loading="eager"
                    />

                    <h1 className="text-3xl md:text-5xl font-extrabold">
                        {t("about.title", { defaultValue: "About Us" })}
                    </h1>

                    <p className="mt-2 inline-flex gap-2 text-xs uppercase tracking-[0.2em] border border-white/15 px-3 py-1 rounded-full">
                        {labels.heritageYears}: <span className="font-semibold">{yearsLocalized}</span>
                    </p>

                    <p className="mt-6 opacity-85">
                        {t("about.tagline", { defaultValue: "Heritage coffee, roasted with care." })}
                    </p>
                </FadeIn>
            </header>

            {/* CONTENT */}
            <main className="container mx-auto max-w-5xl px-6 pb-16">

                {/* Heritage */}
                {heritage?.body && (
                    <>
                        <Divider />
                        <FadeIn>
                            <section className="p-6 rounded-2xl border border-white/15 bg-white/5">
                                <h2 className="text-lg font-semibold mb-2">
                                    {labels.heritageBlock}
                                </h2>
                                <p>{heritage.body}</p>
                            </section>
                        </FadeIn>
                    </>
                )}

                {/* Mission */}
                {mission && (
                    <>
                        <Divider />
                        <FadeIn>
                            <section className="p-6 rounded-2xl border border-white/15 bg-white/5">
                                <h2 className="text-lg font-semibold mb-2">
                                    {labels.mission}
                                </h2>
                                <p>{mission}</p>
                            </section>
                        </FadeIn>
                    </>
                )}

                {/* Core + Values */}
                {(core.length || values.length) && (
                    <>
                        <Divider />
                        <div className="grid md:grid-cols-2 gap-4">

                            {!!core.length && (
                                <FadeIn>
                                    <section className="p-6 rounded-2xl border border-white/15 bg-white/5">
                                        <h2 className="font-semibold mb-3">{labels.core}</h2>
                                        <ul className="space-y-2">
                                            {core.map((c, i) => (
                                                <li key={i}>• {c}</li>
                                            ))}
                                        </ul>
                                    </section>
                                </FadeIn>
                            )}

                            {!!values.length && (
                                <FadeIn>
                                    <section className="p-6 rounded-2xl border border-white/15 bg-white/5">
                                        <h2 className="font-semibold mb-3">{labels.values}</h2>
                                        <ul className="space-y-3">
                                            {values.map((v, i) => (
                                                <li key={i}>
                                                    <div className="font-semibold">{v?.title}</div>
                                                    {v?.body && <p className="opacity-80">{v.body}</p>}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                </FadeIn>
                            )}

                        </div>
                    </>
                )}

                {/* Roast */}
                {(roast?.title || roast?.intro) && (
                    <>
                        <Divider />
                        <FadeIn>
                            <section>
                                <h2 className="text-lg font-semibold mb-2">
                                    {roast?.title || "Our Roast"}
                                </h2>
                                {roast?.intro && <p>{roast.intro}</p>}
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
                                <h2 className="text-lg font-semibold mb-4">
                                    {labels.process}
                                </h2>
                                <ol className="space-y-4 list-decimal pl-5">
                                    {process.map((step, i) => (
                                        <li key={i}>
                                            <div className="font-medium">
                                                {step?.title || "Step"}
                                            </div>
                                            <p className="opacity-80">
                                                {step?.body || step}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        </FadeIn>
                    </>
                )}

                {/* CTA */}
                <Divider />
                <FadeIn className="text-center">
                    <Link
                        to={contactHref}
                        className="inline-block px-6 py-3 rounded-xl font-semibold bg-[var(--brand-ink)] text-[var(--brand-bg)]"
                    >
                        {contactLabel}
                    </Link>
                </FadeIn>

            </main>
        </section>
    );
}