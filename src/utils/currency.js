export const fmt = (amount, currency='KHR') =>
    new Intl.NumberFormat(undefined, { style:'currency', currency }).format(amount)
