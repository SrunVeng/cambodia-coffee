export const translateName = (item, lang) => {
    if(!item) return ''
    if(lang==='en') return item.name_en || item.name || ''
    if(lang==='cn') return item.name_en || item.name || '' // map CN to English labels unless you provide Chinese labels later
    return item.name_km || item.name || ''
}
