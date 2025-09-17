export default function ParallaxSection({ title, subtitle, image, reverse }){
    return (
        <section className="section">
            <div className={`container-narrow grid md:grid-cols-2 gap-10 items-center ${reverse?'md:flex-row-reverse':''}`}>
                <div className="space-y-4">
                    <h2>{title}</h2>
                    <p className="opacity-80">{subtitle}</p>
                </div>
                <div className="relative">
                    <img src={image} alt="" className="rounded-2xl shadow-md"/>
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-[var(--ring)] pointer-events-none" />
                </div>
            </div>
        </section>
    )
}
