export default function RatingStars({ value = 0 }) {
    const full = Math.floor(value);
    const half = value - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return (
        <div className="flex items-center gap-0.5 text-amber-500">
            {Array.from({ length: full }).map((_, i) => (
                <svg key={`f${i}`} className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
            ))}
            {half === 1 && (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M12 2v15.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61z"/>
                </svg>
            )}
            {Array.from({ length: empty }).map((_, i) => (
                <svg key={`e${i}`} className="w-4 h-4 opacity-30" viewBox="0 0 24 24">
                    <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03z" fill="currentColor"/>
                </svg>
            ))}
        </div>
    );
}
