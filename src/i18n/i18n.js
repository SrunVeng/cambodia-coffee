import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import kh from './locales/kh.json'
import cn from './locales/cn.json'

const saved = localStorage.getItem('locale') || 'kh'

i18n
    .use(initReactI18next)
    .init({
        resources: { en:{translation:en}, kh:{translation:kh}, cn:{translation:cn} },
        lng: saved,
        fallbackLng: 'kh',
        interpolation: { escapeValue: false }
    })

// keep <html lang=...> in sync so font stacks apply
document.documentElement.lang = saved === 'en' ? 'en' : (saved === 'cn' ? 'zh-CN' : 'km')

export const setLocale = (lng)=>{
    i18n.changeLanguage(lng)
    localStorage.setItem('locale', lng)
    document.documentElement.lang = lng === 'en' ? 'en' : (lng === 'cn' ? 'zh-CN' : 'km')
}
export default i18n
