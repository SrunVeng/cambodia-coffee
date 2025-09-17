export default function Receipt({ receipt, onReset }){
    return (
        <div className="card p-6 space-y-3">
            <h3 className="text-xl font-semibold">Receipt</h3>
            <pre className="text-sm">{JSON.stringify(receipt, null, 2)}</pre>
            <button className="btn btn-primary" onClick={onReset}>Back to Home</button>
        </div>
    )
}
