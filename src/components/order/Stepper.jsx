export default function Stepper({ steps, active }){
    return (
        <div className="flex items-center gap-3">
            {steps.map((s,i)=>(
                <div key={s} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full grid place-items-center border ${i<=active?'bg-[var(--brand-ink)] text-white':'bg-white border-[var(--ring)]'}`}>{i+1}</div>
                    <div className={`text-sm ${i<=active?'font-semibold':''}`}>{s}</div>
                    {i<steps.length-1 && <div className="w-10 h-px bg-[var(--ring)]"/>}
                </div>
            ))}
        </div>
    )
}
