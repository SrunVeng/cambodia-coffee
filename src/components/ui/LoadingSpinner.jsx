import React from "react"

export default function LoadingSpinner({ className = "" }) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="w-10 h-10 border-4 border-[var(--ring)] border-t-[var(--brand-accent)] rounded-full animate-spin" />
        </div>
    )
}
