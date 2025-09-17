// Haversine + per-km fee calc based on province coords (customer province center)
const R = 6371
const toRad = d => (d * Math.PI) / 180

export function kmDistance(a, b){
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)
    const lat1 = toRad(a.lat); const lat2 = toRad(b.lat)
    const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2
    return 2 * R * Math.asin(Math.sqrt(h))
}

export function deliveryFeeByKm(km){
    // Example: 2,000 KHR base + 1,000 KHR per km, cap at 25km minimum logic can be adjusted
    const base = 2000
    const perKm = 1000
    return Math.round(base + perKm * Math.max(0, km))
}
