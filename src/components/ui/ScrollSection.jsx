import { motion as Motion } from "framer-motion"
import { Link } from "react-router-dom"

const imgVariants = {
    hidden: { opacity: 0, x: -32 },
    show: { opacity: 1, x: 0, transition: { duration: 0.55, ease: "easeOut" } }
}

const textVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut", delay: 0.1 } }
}

export default function ScrollSection({ title, subtitle, image, cta, reverse }) {
    return (
        <section className="w-full bg-[var(--brand-bg)] text-[var(--brand-ink)] py-20">
            <div
                className={`container mx-auto px-6 flex flex-col md:flex-row items-center gap-12 ${
                    reverse ? "md:flex-row-reverse" : ""
                }`}
            >
                {/* Image */}
                <Motion.div
                    variants={imgVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.4 }}
                    className="w-full md:w-1/2 flex justify-center"
                >
                    <div className="aspect-[4/5] w-72 md:w-96 overflow-hidden rounded-2xl shadow-xl">
                        <img
                            src={image}
                            alt={title}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                        />
                    </div>
                </Motion.div>

                {/* Text */}
                <Motion.div
                    variants={textVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.4 }}
                    className="w-full md:w-1/2 space-y-5"
                >
                    <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                        {title}
                    </h2>
                    <p className="text-lg opacity-90">{subtitle}</p>
                    {cta && (
                        <div>
                            <Link
                                to={cta.to}
                                className="inline-block bg-[var(--brand-accent)] text-white px-6 py-3 rounded-xl shadow-md hover:scale-105 transition"
                            >
                                {cta.label}
                            </Link>
                        </div>
                    )}
                </Motion.div>
            </div>
        </section>
    )
}
