import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { translateName } from '../../utils/i18n-helpers'

export default function AddressSelect({ value, onChange }){
    const { i18n, t } = useTranslation()
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [communes, setCommunes] = useState([])
    const [villages, setVillages] = useState([])

    const v = value || {}

    useEffect(()=>{
        fetch('/address/provinces.json').then(r=>r.json()).then(d=> setProvinces(d.provinces||d))
        fetch('/address/districts.json').then(r=>r.json()).then(d=> setDistricts(d.districts||d))
        fetch('/address/communes.json').then(r=>r.json()).then(d=> setCommunes(d.communes||d))
        fetch('/address/villages.json').then(r=>r.json()).then(d=> setVillages(d.villages||d))
        // Alternative: one-tree file /address/addresses.json (your uploaded alternative) → adjust here.
    },[])

    const dByProv = useMemo(()=> districts.filter(d=> d.province_code===v.province), [districts, v.province])
    const cByDist = useMemo(()=> communes.filter(c=> c.district_code===v.district), [communes, v.district])
    const vByComm = useMemo(()=> villages.filter(x=> x.commune_code===v.commune), [villages, v.commune])

    const lang = i18n.language

    return (
        <div className="grid md:grid-cols-4 gap-3">
            <select className="badge" value={v.province||''}
                    onChange={e=> onChange?.({ ...v, province: e.target.value, district:'', commune:'', village:'' })}>
                <option value="">{t('order.province')}</option>
                {provinces.map(p=>
                    <option key={p.code} value={p.code}>{translateName(p, lang)}</option>
                )}
            </select>

            <select className="badge" value={v.district||''}
                    onChange={e=> onChange?.({ ...v, district: e.target.value, commune:'', village:'' })}
                    disabled={!v.province}>
                <option value="">{t('order.district')}</option>
                {dByProv.map(d=>
                    <option key={d.code} value={d.code}>{translateName(d, lang)}</option>
                )}
            </select>

            <select className="badge" value={v.commune||''}
                    onChange={e=> onChange?.({ ...v, commune: e.target.value, village:'' })}
                    disabled={!v.district}>
                <option value="">{t('order.commune')}</option>
                {cByDist.map(c=>
                    <option key={c.code} value={c.code}>{translateName(c, lang)}</option>
                )}
            </select>

            <select className="badge" value={v.village||''}
                    onChange={e=> onChange?.({ ...v, village: e.target.value })}
                    disabled={!v.commune}>
                <option value="">{t('order.village')}</option>
                {vByComm.map(x=>
                    <option key={x.code} value={x.code}>{translateName(x, lang)}</option>
                )}
            </select>
        </div>
    )
}
