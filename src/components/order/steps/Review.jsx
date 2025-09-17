export default function Review({ info, summary, onNext, onBack }){
    return (
        <div className="space-y-4">
            <div className="card p-4">
                <div className="font-semibold mb-2">Customer</div>
                <div>{info.name} • {info.email} • {info.phone}</div>
            </div>
            <div className="card p-4">
                <div className="font-semibold mb-2">Address</div>
                <pre className="text-sm opacity-80">{JSON.stringify(info.address, null, 2)}</pre>
            </div>
            <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={onBack}>Back</button>
                <button className="btn btn-primary" onClick={()=> onNext?.()}>Proceed to Payment</button>
            </div>
        </div>
    )
}
