import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { translateName } from '../../utils/i18n-helpers'

export default function AddressSelect({ value, onChange }) {
    const { i18n, t } = useTranslation()
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [communes, setCommunes] = useState([])
    const [villages, setVillages] = useState([])

    const v = value || {}

    // Load datasets once
    useEffect(() => {
        let abort = false
        ;(async () => {
            try {
                const [p, d, c, vv] = await Promise.all([
                    fetch('/address/provinces.json').then(r => r.json()),
                    fetch('/address/districts.json').then(r => r.json()),
                    fetch('/address/communes.json').then(r => r.json()),
                    fetch('/address/villages.json').then(r => r.json()),
                ])
                if (abort) return
                setProvinces(p.provinces || p)
                setDistricts(d.districts || d)
                setCommunes(c.communes || c)
                setVillages(vv.villages || vv)
            } catch (e) {
                // keep empty arrays on error
                console.error('Address data load failed', e)
            }
        })()
        return () => { abort = true }
    }, [])

    // Filtered children
    const dByProv = useMemo(
        () => districts.filter(d => d.province_code === v.province),
        [districts, v.province]
    )
    const cByDist = useMemo(
        () => communes.filter(c => c.district_code === v.district),
        [communes, v.district]
    )
    const vByComm = useMemo(
        () => villages.filter(x => x.commune_code === v.commune),
        [villages, v.commune]
    )

    const lang = i18n.language
    const labelOf = (item) => translateName(item, lang)

    // Update helpers (store both code + label, reset children)
    const setLevel = (level, code) => {
        const next = { ...v }

        if (level === 'province') {
            const item = provinces.find(p => p.code === code)
            next.province = code || undefined
            next.provinceName = item ? labelOf(item) : undefined
            next.district = next.districtName = undefined
            next.commune  = next.communeName  = undefined
            next.village  = next.villageName  = undefined
        } else if (level === 'district') {
            const item = dByProv.find(d => d.code === code)
            next.district = code || undefined
            next.districtName = item ? labelOf(item) : undefined
            next.commune  = next.communeName  = undefined
            next.village  = next.villageName  = undefined
        } else if (level === 'commune') {
            const item = cByDist.find(c => c.code === code)
            next.commune = code || undefined
            next.communeName = item ? labelOf(item) : undefined
            next.village = next.villageName = undefined
        } else if (level === 'village') {
            const item = vByComm.find(x => x.code === code)
            next.village = code || undefined
            next.villageName = item ? labelOf(item) : undefined
        }

        onChange?.(next)
    }

    // Backfill *Name if consumer passes only codes; re-localize when language changes
    useEffect(() => {
        if (!provinces.length) return
        const n = { ...v }
        let changed = false

        if (v.province && !v.provinceName) {
            const it = provinces.find(p => p.code === v.province)
            if (it) { n.provinceName = labelOf(it); changed = true }
        }
        if (v.district && !v.districtName && districts.length) {
            const it = districts.find(d => d.code === v.district)
            if (it) { n.districtName = labelOf(it); changed = true }
        }
        if (v.commune && !v.communeName && communes.length) {
            const it = communes.find(c => c.code === v.commune)
            if (it) { n.communeName = labelOf(it); changed = true }
        }
        if (v.village && !v.villageName && villages.length) {
            const it = villages.find(x => x.code === v.village)
            if (it) { n.villageName = labelOf(it); changed = true }
        }

        // Also refresh labels when language changes
        if (!changed && (v.provinceName || v.districtName || v.communeName || v.villageName)) {
            if (v.province) {
                const it = provinces.find(p => p.code === v.province)
                if (it && n.provinceName !== labelOf(it)) { n.provinceName = labelOf(it); changed = true }
            }
            if (v.district) {
                const it = districts.find(d => d.code === v.district)
                if (it && n.districtName !== labelOf(it)) { n.districtName = labelOf(it); changed = true }
            }
            if (v.commune) {
                const it = communes.find(c => c.code === v.commune)
                if (it && n.communeName !== labelOf(it)) { n.communeName = labelOf(it); changed = true }
            }
            if (v.village) {
                const it = villages.find(x => x.code === v.village)
                if (it && n.villageName !== labelOf(it)) { n.villageName = labelOf(it); changed = true }
            }
        }

        if (changed) onChange?.(n)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provinces, districts, communes, villages, lang])

    return (
        <div className="grid md:grid-cols-4 gap-3">
            <select
                className="badge"
                value={v.province || ''}
                onChange={e => setLevel('province', e.target.value)}
            >
                <option value="">{t('order.province')}</option>
                {provinces.map(p => (
                    <option key={p.code} value={p.code}>{labelOf(p)}</option>
                ))}
            </select>

            <select
                className="badge"
                value={v.district || ''}
                onChange={e => setLevel('district', e.target.value)}
                disabled={!v.province}
            >
                <option value="">{t('order.district')}</option>
                {dByProv.map(d => (
                    <option key={d.code} value={d.code}>{labelOf(d)}</option>
                ))}
            </select>

            <select
                className="badge"
                value={v.commune || ''}
                onChange={e => setLevel('commune', e.target.value)}
                disabled={!v.district}
            >
                <option value="">{t('order.commune')}</option>
                {cByDist.map(c => (
                    <option key={c.code} value={c.code}>{labelOf(c)}</option>
                ))}
            </select>

            <select
                className="badge"
                value={v.village || ''}
                onChange={e => setLevel('village', e.target.value)}
                disabled={!v.commune}
            >
                <option value="">{t('order.village')}</option>
                {vByComm.map(x => (
                    <option key={x.code} value={x.code}>{labelOf(x)}</option>
                ))}
            </select>
        </div>
    )
}
