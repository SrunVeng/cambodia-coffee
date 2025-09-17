import data from "../../data/data.json"

export default function Footer() {
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
            © {new Date().getFullYear()} {data.APP_NAME_EN}
          </span>
                </div>

                {/* Right: Social links */}
                <div className="flex gap-6 text-sm font-medium">
                    <a
                        href={data.SOCIAL.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[var(--brand-accent)] transition"
                    >
                        Facebook
                    </a>
                    <a
                        href={data.SOCIAL.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[var(--brand-accent)] transition"
                    >
                        Instagram
                    </a>
                </div>
            </div>
        </footer>
    )
}
