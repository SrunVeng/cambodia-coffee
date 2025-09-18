export const fmt = (amount, currency='KHR') =>
    new Intl.NumberFormat(undefined, { style:'currency', currency }).format(amount)


// Convert KHR numbers to USD (two decimals) using rate=4000 by default
export function khrToUsd(khr, rate = 4000) {
    const usd = Number(khr || 0) / Number(rate || 4000);
    // round to cents
    return Math.round(usd * 100) / 100;
}
