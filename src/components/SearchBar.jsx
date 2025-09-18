import { useEffect, useRef } from "react"
import { Search, X } from "lucide-react"

export default function SearchBar({ value, onChange, placeholder }) {
    const inputRef = useRef(null)

    // Press "/" anywhere to focus search
    useEffect(() => {
        const onKey = (e) => {
            const tag = document.activeElement?.tagName?.toLowerCase()
            if (["input", "textarea", "select"].includes(tag) || e.metaKey || e.ctrlKey || e.altKey) return
            if (e.key === "/") {
                e.preventDefault()
                inputRef.current?.focus()
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [])

    return (
        <div className="relative w-full">
            {/* Search icon */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />

            <input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="
          h-10 w-full pl-10 pr-16 rounded-xl border border-gray-200
          bg-white shadow-sm outline-none
          focus:ring-2 focus:ring-[#2d1a14]/60 focus:border-transparent
          placeholder:text-gray-400 text-[15px]
        "
            />

            {/* Clear button */}
            {value ? (
                <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                        onChange("")
                        inputRef.current?.focus()
                    }}
                    className="
            absolute right-2 top-1/2 -translate-y-1/2
            grid place-items-center h-7 w-7 rounded-full
            border border-gray-200 hover:bg-gray-50 active:scale-95 transition
          "
                >
                    <X className="h-4 w-4 text-gray-600" />
                </button>
            ) : (
                <span
                    className="
            pointer-events-none absolute right-2 top-1/2 -translate-y-1/2
            hidden sm:block select-none text-xs text-gray-400
            border rounded-md px-1.5 py-0.5
          "
                >
          /
        </span>
            )}
        </div>
    )
}
