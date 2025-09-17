import data from '../../data/data.json'

export default function Footer(){
    return (
        <footer className="border-t border-[var(--ring)]">
            <div className="container-narrow py-10 text-sm flex items-center justify-between">
                <span>© {new Date().getFullYear()} {data.APP_NAME}</span>
                <div className="flex gap-4 opacity-70">
                    <a href={data.SOCIAL.facebook} target="_blank">Facebook</a>
                    <a href={data.SOCIAL.instagram} target="_blank">Instagram</a>
                </div>
            </div>
        </footer>
    )
}
