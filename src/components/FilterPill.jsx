import { SlidersHorizontal } from "lucide-react";

export default function FilterPill({ activeCount = 0, onClick, label = "Filter" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="
        relative inline-flex items-center gap-2 h-10 px-3
        rounded-xl border border-gray-200 bg-white hover:bg-gray-50
        shadow-sm active:scale-95 transition
      "
        >
            <SlidersHorizontal className="h-4 w-4 text-gray-700" />
            <span className="text-sm font-medium text-gray-800">{label}</span>
            {activeCount > 0 && (
                <span className="ml-1 rounded-full text-[11px] px-1.5 py-0.5 bg-[#2d1a14] text-white">
          {activeCount}
        </span>
            )}
        </button>
    );
}
