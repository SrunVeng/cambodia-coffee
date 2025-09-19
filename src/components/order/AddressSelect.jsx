import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateName } from "../../utils/i18n-helpers";
import SearchableSelect from "../../components/ui/SearchableSelect.jsx";

/** Normalize any code to a string so equality checks always work */
const s = (v) => (v == null ? "" : String(v));

/** In-memory cache so re-entering the step doesn't re-fetch every time */
const C = typeof window !== "undefined" ? (window.__ADDR_CACHE__ ||= {}) : {};

export default function AddressSelect({ value, onChange, lang }) {
    const { i18n, t } = useTranslation();
    const L = (lang || i18n.language || "en").toLowerCase();
    const v = value || {};

    // Raw datasets (cached across mounts)
    const [provinces, setProvinces] = useState(C.provinces || []);
    const [districts, setDistricts] = useState(C.districts || []);
    const [communes, setCommunes] = useState(C.communes || []);
    const [villages, setVillages] = useState(C.villages || []);

    // Fetch once (with cache)
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                if (!C.provinces) {
                    const [p, d, c, vv] = await Promise.all([
                        fetch("/address/provinces.json").then((r) => r.json()),
                        fetch("/address/districts.json").then((r) => r.json()),
                        fetch("/address/communes.json").then((r) => r.json()),
                        fetch("/address/villages.json").then((r) => r.json()),
                    ]);
                    const P = (p.provinces || p).map((x) => ({ ...x, code: s(x.code), province_code: s(x.province_code) }));
                    const D = (d.districts || d).map((x) => ({ ...x, code: s(x.code), province_code: s(x.province_code) }));
                    const Cc = (c.communes || c).map((x) => ({ ...x, code: s(x.code), district_code: s(x.district_code) }));
                    const V = (vv.villages || vv).map((x) => ({ ...x, code: s(x.code), commune_code: s(x.commune_code) }));
                    C.provinces = P; C.districts = D; C.communes = Cc; C.villages = V;
                }
                if (!alive) return;
                setProvinces(C.provinces);
                setDistricts(C.districts);
                setCommunes(C.communes);
                setVillages(C.villages);
            } catch (e) {
                console.error("Address load failed", e);
            }
        })();
        return () => { alive = false; };
    }, []);

    // Build localized display lists each render (no stale labels)
    const labelOf = (obj) => translateName(obj, L);
    const provincesL = useMemo(
        () => provinces.map((x) => ({ ...x, label: labelOf(x) })),
        [provinces, L]
    );

    const dByProv = useMemo(
        () => districts.filter((d) => s(d.province_code) === s(v.province)),
        [districts, v.province]
    );
    const districtsL = useMemo(
        () => dByProv.map((x) => ({ ...x, label: labelOf(x) })),
        [dByProv, L]
    );

    const cByDist = useMemo(
        () => communes.filter((c) => s(c.district_code) === s(v.district)),
        [communes, v.district]
    );
    const communesL = useMemo(
        () => cByDist.map((x) => ({ ...x, label: labelOf(x) })),
        [cByDist, L]
    );

    const vByComm = useMemo(
        () => villages.filter((x) => s(x.commune_code) === s(v.commune)),
        [villages, v.commune]
    );
    const villagesL = useMemo(
        () => vByComm.map((x) => ({ ...x, label: labelOf(x) })),
        [vByComm, L]
    );

    // Keep the stored *Name fields in sync with language (and after returning to this step)
    const lastSyncRef = useRef("");
    useEffect(() => {
        const key = [L, v.province, v.district, v.commune, v.village].map(s).join("|");
        if (key === lastSyncRef.current) return;
        lastSyncRef.current = key;

        const next = { ...v };
        if (v.province) {
            const it = provinces.find((p) => s(p.code) === s(v.province));
            next.provinceName = it ? labelOf(it) : v.provinceName;
        }
        if (v.district) {
            const it = districts.find((d) => s(d.code) === s(v.district));
            next.districtName = it ? labelOf(it) : v.districtName;
        }
        if (v.commune) {
            const it = communes.find((c) => s(c.code) === s(v.commune));
            next.communeName = it ? labelOf(it) : v.communeName;
        }
        if (v.village) {
            const it = villages.find((x) => s(x.code) === s(v.village));
            next.villageName = it ? labelOf(it) : v.villageName;
        }
        if (
            next.provinceName !== v.provinceName ||
            next.districtName !== v.districtName ||
            next.communeName !== v.communeName ||
            next.villageName !== v.villageName
        ) {
            onChange?.(next);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [L, provinces, districts, communes, villages, v.province, v.district, v.commune, v.village]);

    const setLevel = (level, code) => {
        const next = { ...v };
        if (level === "province") {
            const item = provinces.find((p) => s(p.code) === s(code));
            next.province = s(code) || undefined;
            next.provinceName = item ? labelOf(item) : undefined;
            next.district = next.districtName = undefined;
            next.commune = next.communeName = undefined;
            next.village = next.villageName = undefined;
        } else if (level === "district") {
            const item = dByProv.find((d) => s(d.code) === s(code));
            next.district = s(code) || undefined;
            next.districtName = item ? labelOf(item) : undefined;
            next.commune = next.communeName = undefined;
            next.village = next.villageName = undefined;
        } else if (level === "commune") {
            const item = cByDist.find((c) => s(c.code) === s(code));
            next.commune = s(code) || undefined;
            next.communeName = item ? labelOf(item) : undefined;
            next.village = next.villageName = undefined;
        } else if (level === "village") {
            const item = vByComm.find((x) => s(x.code) === s(code));
            next.village = s(code) || undefined;
            next.villageName = item ? labelOf(item) : undefined;
        }
        onChange?.(next);
    };

    // Convert to the generic item shape { value, label }
    const asItems = (arr) => arr.map((x) => ({ value: s(x.code), label: x.label }));

    return (
        <div className="grid gap-3 md:grid-cols-4">
            {/* Province */}
            <SearchableSelect
                placeholder={t("order.province", { defaultValue: "Province" })}
                items={asItems(provincesL)}
                value={v.province}
                onChange={(code) => setLevel("province", code)}
                clearable
            />

            {/* District */}
            <SearchableSelect
                placeholder={t("order.district", { defaultValue: "District" })}
                items={asItems(districtsL)}
                value={v.district}
                onChange={(code) => setLevel("district", code)}
                disabled={!v.province}
                clearable
            />

            {/* Commune */}
            <SearchableSelect
                placeholder={t("order.commune", { defaultValue: "Commune" })}
                items={asItems(communesL)}
                value={v.commune}
                onChange={(code) => setLevel("commune", code)}
                disabled={!v.district}
                clearable
            />

            {/* Village */}
            <SearchableSelect
                placeholder={t("order.village", { defaultValue: "Village" })}
                items={asItems(villagesL)}
                value={v.village}
                onChange={(code) => setLevel("village", code)}
                disabled={!v.commune}
                clearable
            />
        </div>
    );
}
