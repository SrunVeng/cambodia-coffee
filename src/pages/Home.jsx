// src/pages/Home.jsx
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import data from '../data/data.json'

function ScrollSection({ title, subtitle, image, cta, reverse }) {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    })

    // Background smooth parallax
    const y = useTransform(scrollYProgress, [0, 1], [60, -60])
    const scale = useTransform(scrollYProgress, [0, 1], [1.2, 1])
    const imgOpacity = useTransform(scrollYProgress, [0, 0.15, 1], [0, 1, 1])

    // Text: smooth rise + subtle side shift
    const x = useTransform(
        scrollYProgress,
        [0, 0.4, 1],
        reverse ? [80, 0, -40] : [-80, 0, 40]
    )
    const textOpacity = useTransform(scrollYProgress, [0, 0.25, 0.8, 1], [0, 1, 1, 0])
    const blur = useTransform(scrollYProgress, [0, 0.3], ['6px', '0px'])

    return (
        <section
            ref={ref}
            className="relative h-screen flex items-center overflow-hidden"
        >
            {/* Background */}
            <motion.img
                src={image}
                alt={title}
                style={{ y, scale, opacity: imgOpacity }}
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                viewport={{ once: true }}
                className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />

            {/* Text block */}
            <motion.div
                style={{ opacity: textOpacity, x, filter: `blur(${blur})` }}
                initial={{ opacity: 0, y: 60, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1, ease: 'easeOut' }}
                viewport={{ once: true, amount: 0.4 }}
                className={`relative z-10 max-w-2xl px-6 space-y-5 text-white 
          ${reverse ? 'ml-auto text-right' : 'mr-auto text-left'}`}
            >
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">{title}</h2>
                <p className="text-lg opacity-90">{subtitle}</p>
                {cta && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 120, damping: 15, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        <Link
                            to={cta.to}
                            className="btn btn-primary inline-block mt-4 shadow-lg hover:scale-105 transition"
                        >
                            {cta.label}
                        </Link>
                    </motion.div>
                )}
            </motion.div>
        </section>
    )
}

export default function Home() {
    const { t } = useTranslation()
    const { HOME_IMAGES } = data

    return (
        <>
            {/* Hero */}
            <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="z-10 space-y-6"
                >
                    <h1 className="text-5xl md:text-6xl font-bold max-w-3xl mx-auto leading-tight">
                        {t('home.heroTitle')}
                    </h1>
                    <Link
                        className="btn btn-primary shadow-lg hover:scale-105 transition"
                        to="/products"
                    >
                        {t('home.cta')}
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.35 }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                    className={`absolute inset-0 bg-[url('${HOME_IMAGES.hero}')] bg-cover bg-center scale-110`}
                />
            </section>

            {/* Story sections */}
            <ScrollSection
                title="Farm to Cup"
                subtitle="Careful sourcing, transparent roasting profiles, traceable lots."
                image={HOME_IMAGES.farm}
            />
            <ScrollSection
                title="Brew Simply"
                subtitle="Minimal tools, maximum clarity—our guides help you get there."
                image={HOME_IMAGES.brew}
                reverse
            />
            <ScrollSection
                title="Featured"
                subtitle="Editor’s picks from this month."
                image={HOME_IMAGES.featured}
                cta={{ to: '/products', label: t('home.cta') }}
            />
        </>
    )
}
