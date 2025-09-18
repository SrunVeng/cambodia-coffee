export const translateName = (item, lang) => {
    if(!item) return ''
    if(lang==='en') return item.name_en || item.name || ''
    if(lang==='cn') return item.name_en || item.name || '' // map CN to English labels unless you provide Chinese labels later
    return item.name_km || item.name || ''
}




export function normalizeLang(lang = "en") {
    const l = (lang || "en").toLowerCase();
    if (l === "km") return "kh";
    if (l === "zh") return "cn";
    return ["en", "kh", "cn"].includes(l) ? l : "en";
}

export function tField(obj, lang) {
    const L = normalizeLang(lang);
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[L] ?? obj.en ?? "";
}
