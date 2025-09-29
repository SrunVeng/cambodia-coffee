// src/pages/order/steps/Info.jsx
import React, {
    useEffect,
    useMemo,
    useState,
    useCallback,
    useRef,
} from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AddressSelect from "../AddressSelect";

// ---------- language helper ----------
const normalizeLang = (L) => {
    const x = String(L || "en").toLowerCase();
    if (x === "km" || x.startsWith("km-") || x === "kh" || x.startsWith("kh-"))
        return "kh";
    if (x === "zh" || x.startsWith("zh-") || x === "cn" || x.startsWith("cn-"))
        return "cn";
    return ["en", "kh", "cn"].includes(x) ? x : "en";
};

const ERR_DEFAULTS = {
    "address.required": "Please complete your address.",
    "errors.name_required": "Your name is required.",
    "errors.name_short": "Name is too short.",
    "errors.email_invalid": "Please enter a valid email.",
    "errors.phone_required": "Your phone number is required.",
    "errors.phone_invalid": "Use a valid phone number.",
};

// ✅ Cambodia mobile/landline (no country code), 9–10 digits total with leading 0
const KH_PHONE = /^0[1-9]\d{7,8}$/;

// ---------- icons ----------
const Icon = {
    User: (p) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={"h-4 w-4 " + (p.className || "")}
        >
            <path strokeWidth="1.5" d="M20 21a8 8 0 10-16 0" />
            <circle cx="12" cy="7" r="4" strokeWidth="1.5" />
        </svg>
    ),
    Mail: (p) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={"h-4 w-4 " + (p.className || "")}
        >
            <path strokeWidth="1.5" d="M4 6h16v12H4z" />
            <path strokeWidth="1.5" d="M4 7l8 6 8-6" />
        </svg>
    ),
    Phone: (p) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={"h-4 w-4 " + (p.className || "")}
        >
            <path
                strokeWidth="1.5"
                d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011.1-.2 11 11 0 003.5.6 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h2.4a1 1 0 011 1 11 11 0 00.6 3.5 1 1 0 01-.2 1.1l-2.2 2.2z"
            />
        </svg>
    ),
    MapPin: (p) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={"h-4 w-4 " + (p.className || "")}
        >
            <path
                strokeWidth="1.5"
                d="M12 22s7-6.1 7-12a7 7 0 10-14 0c0 5.9 7 12 7 12z"
            />
            <circle cx="12" cy="10" r="3" strokeWidth="1.5" />
        </svg>
    ),
    RotateCcw: (p) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={"h-4 w-4 " + (p.className || "")}
        >
            <path strokeWidth="1.5" d="M1 4v6h6" />
            <path strokeWidth="1.5" d="M3.5 13A8.5 8.5 0 1120 8" />
        </svg>
    ),
    ArrowRight: (p) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={"h-4 w-4 " + (p.className || "")}
        >
            <path strokeWidth="1.5" d="M5 12h14M13 5l7 7-7 7" />
        </svg>
    ),
};

// ---------- Leaflet loader ----------
function ensureLeaflet() {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") return resolve(null);
        if (window.L) return resolve(window.L);

        const linkId = "leaflet-css";
        if (!document.getElementById(linkId)) {
            const link = document.createElement("link");
            link.id = linkId;
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }

        const scriptId = "leaflet-js";
        const existing = document.getElementById(scriptId);
        if (existing) {
            existing.addEventListener("load", () => resolve(window.L));
            existing.addEventListener("error", reject);
            return;
        }
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = () => resolve(window.L);
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// ---------- Mini map picker ----------
function MiniMapPicker({ value, onChange, height = 240, autoOpenOnGeo = false }) {
    const { t } = useTranslation();
    const containerId = React.useMemo(
        () => "leaflet-picker-" + Math.random().toString(36).slice(2),
        []
    );
    const [open, setOpen] = useState(false);
    const [ready, setReady] = useState(false);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const clickHandlerRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        let disposed = false;
        ensureLeaflet().then((L) => {
            if (disposed) return;
            setReady(true);
            const start =
                value?.geo?.lat && value?.geo?.lng
                    ? [value.geo.lat, value.geo.lng]
                    : [11.5564, 104.9282];
            const map = L.map(containerId, { zoomControl: true }).setView(
                start,
                value?.geo ? 16 : 12
            );
            mapRef.current = map;
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
                maxZoom: 19,
            }).addTo(map);
            if (value?.geo?.lat && value?.geo?.lng) {
                markerRef.current = L.marker([value.geo.lat, value.geo.lng]).addTo(map);
            } else {
                markerRef.current = L.marker(start);
            }
            clickHandlerRef.current = (e) => {
                const { lat, lng } = e.latlng;
                if (!map.hasLayer(markerRef.current)) markerRef.current.addTo(map);
                markerRef.current.setLatLng([lat, lng]);
                onChange?.((a) => ({
                    ...(a || {}),
                    geo: { lat, lng },
                    geoSrc: "manual",
                    geoAcc: undefined,
                    geoConfirmed: true, // manual pin = confirmed
                }));
            };
            map.on("click", clickHandlerRef.current);
        });
        return () => {
            disposed = true;
            if (mapRef.current) {
                if (clickHandlerRef.current) {
                    mapRef.current.off("click", clickHandlerRef.current);
                    clickHandlerRef.current = null;
                }
                try {
                    mapRef.current.remove();
                } catch {}
            }
            mapRef.current = null;
            markerRef.current = null;
        };
    }, [open, containerId, onChange]);

    useEffect(() => {
        const { lat, lng } = value?.geo || {};
        if (!lat || !lng) {
            if (autoOpenOnGeo && !open) setOpen(true);
            return;
        }
        if (autoOpenOnGeo && !open) {
            setOpen(true);
            return;
        }
        const map = mapRef.current;
        if (!map || !markerRef.current) return;
        if (!map.hasLayer(markerRef.current)) markerRef.current.addTo(map);
        map.setView([lat, lng], 17, { animate: true });
        markerRef.current.setLatLng([lat, lng]);
    }, [value?.geo, autoOpenOnGeo, open]);

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setOpen((x) => !x)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#e7dbc9] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#3b2a1d] shadow-sm transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#c9a44c]"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        stroke="currentColor"
                        fill="none"
                    >
                        <path d="M3 7l9-4 9 4-9 4-9-4z" strokeWidth="1.5" />
                        <path d="M3 17l9-4 9 4" strokeWidth="1.5" />
                        <path d="M3 12l9 4 9-4" strokeWidth="1.5" />
                    </svg>
                    {open
                        ? t("address.map_hide", { defaultValue: "Hide map" })
                        : t("address.map_pick", { defaultValue: "Pick on map" })}
                </button>

                {open && (
                    <button
                        type="button"
                        onClick={() => {
                            if (!mapRef.current) return;
                            mapRef.current.locate({
                                setView: true,
                                maxZoom: 17,
                                enableHighAccuracy: true,
                            });
                            mapRef.current.once("locationfound", (e) => {
                                const { lat, lng } = e.latlng;
                                if (!mapRef.current.hasLayer(markerRef.current))
                                    markerRef.current.addTo(mapRef.current);
                                markerRef.current.setLatLng([lat, lng]);
                                onChange?.((a) => ({
                                    ...(a || {}),
                                    geo: { lat, lng },
                                    geoSrc: "gps-map",
                                    geoAcc: undefined,
                                    geoConfirmed: false,
                                }));
                            });
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-[#e7dbc9] px-2 py-1 text-[11px] text-[#3b2a1d]"
                    >
                        {t("address.map_locate", { defaultValue: "Locate on map" })}
                    </button>
                )}
            </div>

            {open && (
                <div
                    id={containerId}
                    style={{ height }}
                    className="rounded-xl border border-[#e7dbc9] overflow-hidden z-0"
                    aria-busy={!ready}
                />
            )}
        </div>
    );
}

// ---------- main form ----------
export default function Info({ data, onNext, onResetClick, onProgress }) {
    const { t, i18n } = useTranslation();
    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        reset: resetForm,
        setValue,
        watch,
        formState: { errors, isValid, isSubmitting },
    } = useForm({
        defaultValues: { name: "", email: "", phone: "", ...(data || {}) },
        mode: "onChange",
    });

    // mirror address validity into RHF so isValid updates instantly
    useEffect(() => {
        register("addressGuard", { validate: (v) => v === "ok" || "address.required" });
    }, [register]);

    const [addr, setAddr] = useState(data?.address || {});
    const [geoBusy, setGeoBusy] = useState(false);
    const [geoErrorKey, setGeoErrorKey] = useState("");
    const [openMapOnGeo, setOpenMapOnGeo] = useState(false);
    const [closeMenusFlag, setCloseMenusFlag] = useState(false);
    const watchIdRef = useRef(null);
    const watchTimerRef = useRef(null);

    const L = normalizeLang(i18n.language);
    const toErr = (key) =>
        t(key, { defaultValue: ERR_DEFAULTS[key] || "Invalid value." });

    // keep form in sync if parent resets/loads different data
    useEffect(() => {
        resetForm({
            name: data?.name || "",
            email: data?.email || "",
            phone: data?.phone || "",
        });
        setAddr(data?.address || {});
    }, [data, resetForm]);

    // push address validity into RHF hidden field (STRICT: all levels required)
    useEffect(() => {
        const ok = !!(addr?.province && addr?.district && addr?.commune && addr?.village);
        setValue("addressGuard", ok ? "ok" : "", { shouldValidate: true });
        if (!ok) setError("address", { type: "required", message: "address.required" });
        else clearErrors("address");
    }, [addr, setValue, setError, clearErrors]);

    const nameVal = watch("name");
    const emailVal = watch("email");
    const phoneVal = watch("phone");

    // Cambodia bounds guard
    const inCambodiaBBox = ({ lat, lng }) =>
        lat >= 9.5 && lat <= 14.8 && lng >= 102.0 && lng <= 107.8;

    // Determine if geo is trusted (for payload; UI gating uses confirm rule)
    const isTrustedGeo = (a) => {
        const g = a?.geo;
        if (!g) return false;
        if (!inCambodiaBBox(g)) return false;
        if (a.geoSrc === "manual") return true;
        const acc = a.geoAcc ?? Infinity;
        return acc <= 50 && a.geoConfirmed === true;
    };

    // Geolocation helpers
    const stopWatch = () => {
        if (watchIdRef.current != null && navigator.geolocation?.clearWatch) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }
        watchIdRef.current = null;
        if (watchTimerRef.current) {
            clearTimeout(watchTimerRef.current);
            watchTimerRef.current = null;
        }
    };

    const isGoodFix = (coords) => {
        const acc = coords?.accuracy ?? 99999;
        if (!Number.isFinite(acc)) return false;
        if (acc > 1000) return false;
        const { latitude: lat, longitude: lng } = coords || {};
        if (typeof lat === "number" && typeof lng === "number") {
            if (!inCambodiaBBox({ lat, lng })) return false;
        }
        return true;
    };

    const applyPosition = (coords, sourceLabel = "gps") => {
        const { latitude, longitude, accuracy } = coords || {};
        if (typeof latitude !== "number" || typeof longitude !== "number") return false;

        if (!isGoodFix(coords)) {
            setGeoErrorKey("address.locate_inexact");
            setAddr((a) => ({
                ...(a || {}),
                geoPreview: { lat: latitude, lng: longitude },
                geoAcc: accuracy,
                geoSrc: sourceLabel,
                geoConfirmed: false,
            }));
            setOpenMapOnGeo(true);
            return false;
        }

        setAddr((a) => ({
            ...(a || {}),
            geo: { lat: latitude, lng: longitude },
            geoAcc: accuracy,
            geoSrc: sourceLabel,
            geoConfirmed: false,
            geoPreview: undefined,
        }));
        setOpenMapOnGeo(true);
        return true;
    };

    const handleUseLocation = async () => {
        setGeoErrorKey("");
        stopWatch();

        const isSecure =
            window.location.protocol === "https:" ||
            window.location.hostname === "localhost";
        if (!isSecure) {
            setGeoErrorKey("address.geo_https_required");
            return;
        }
        if (!("geolocation" in navigator)) {
            setGeoErrorKey("address.geo_not_supported");
            return;
        }
        try {
            if (navigator.permissions?.query) {
                const p = await navigator.permissions.query({ name: "geolocation" });
                if (p.state === "denied") {
                    setGeoErrorKey("address.geo_permission_blocked");
                    return;
                }
            }
        } catch {}

        setGeoBusy(true);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const accepted = applyPosition(pos.coords, "gps-instant");
                const acc = pos.coords?.accuracy ?? 99999;
                if ((!accepted || acc > 60) && navigator.geolocation.watchPosition) {
                    watchIdRef.current = navigator.geolocation.watchPosition(
                        (p) => {
                            const ok = applyPosition(p.coords, "gps-watch");
                            const a = p.coords?.accuracy ?? 99999;
                            if (ok && a <= 30) stopWatch();
                        },
                        () => {},
                        { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
                    );
                    watchTimerRef.current = setTimeout(stopWatch, 12000);
                }
                setGeoBusy(false);
            },
            (err) => {
                const code = err?.code;
                const key =
                    code === 1
                        ? "address.geo_permission_denied"
                        : code === 2
                            ? "address.geo_position_unavailable"
                            : code === 3
                                ? "address.geo_timeout"
                                : "address.geo_failed";
                setGeoErrorKey(key);
                setGeoBusy(false);
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
    };

    useEffect(() => stopWatch, []);

    const selectedParts = useMemo(
        () =>
            [addr.villageName, addr.communeName, addr.districtName, addr.provinceName]
                .filter(Boolean)
                .join(", "),
        [addr.villageName, addr.communeName, addr.districtName, addr.provinceName]
    );

    // canSubmit: base form valid + if a pin exists it must be confirmed
    const { isValid: rhfValid, isSubmitting: rhfSubmitting } = {
        isValid,
        isSubmitting,
    };
    const canSubmit = useMemo(() => {
        const baseOk =
            rhfValid &&
            !!addr?.province &&
            !!addr?.district &&
            !!addr?.commune &&
            !!addr?.village &&
            !rhfSubmitting;
        const hasPin = !!(
            addr?.geo &&
            typeof addr.geo.lat === "number" &&
            typeof addr.geo.lng === "number"
        );
        const confirmedOk = !hasPin || !!addr?.geoConfirmed;
        return baseOk && confirmedOk;
    }, [
        rhfValid,
        rhfSubmitting,
        addr?.province,
        addr?.district,
        addr?.commune,
        addr?.village,
        addr?.geo,
        addr?.geoConfirmed,
    ]);

    // inform parent so stepper can become clickable immediately (STRICT + optional pin confirm)
    useEffect(() => {
        const draft = {
            name: nameVal || "",
            email: emailVal || "",
            phone: phoneVal || "",
            address: addr || {},
        };
        const a = draft.address || {};
        const hasPin =
            !!a?.geo && typeof a.geo.lat === "number" && typeof a.geo.lng === "number";
        const confirmedOk = !hasPin || !!a.geoConfirmed;
        const validForNext = !!(
            draft.name &&
            draft.phone &&
            a.province &&
            a.district &&
            a.commune &&
            a.village &&
            confirmedOk
        );
        onProgress?.(draft, validForNext);
    }, [nameVal, emailVal, phoneVal, addr, onProgress]);

    const submit = async (v) => {
        if (!canSubmit) return;

        const trusted = isTrustedGeo(addr);
        const safeAddr = {
            province: addr.province,
            provinceName: addr.provinceName,
            district: addr.district,
            districtName: addr.districtName,
            commune: addr.commune,
            communeName: addr.communeName,
            village: addr.village,
            villageName: addr.villageName,
            street: addr.street,
            geoTrusted: trusted,
            ...(trusted
                ? {
                    geo: addr.geo,
                    geoAcc: addr.geoAcc,
                    geoSrc: addr.geoSrc,
                    geoConfirmed: true,
                }
                : {
                    geoCandidate: addr.geo || addr.geoPreview,
                    geoAcc: addr.geoAcc,
                    geoSrc: addr.geoSrc,
                }),
        };

        const next = { ...v, address: safeAddr };
        await onNext?.(next); // parent will persist with LS_KEYS.INFO
    };

    const clearLocal = useCallback(() => {
        resetForm({ name: "", email: "", phone: "" });
        setAddr({});
    }, [resetForm]);

    const handleResetPress = () => {
        setCloseMenusFlag((f) => !f); // close AddressSelect menus
        if (onResetClick) onResetClick();
        else clearLocal();
    };

    const inputBase =
        "block w-full rounded-xl px-4 py-3 shadow-sm transition bg-[#fffaf3] text-[#3b2a1d] placeholder-[#9b8b7c] border focus:outline-none focus:ring-2";
    const okRing = "border-[#e7dbc9] focus:border-[#c9a44c] focus:ring-[#c9a44c]";
    const errRing = "border-red-300 focus:border-red-400 focus:ring-red-300";

    return (
        <form onSubmit={handleSubmit(submit)} className="space-y-6">
            {/* hidden input used only for RHF validity */}
            <input type="hidden" {...register("addressGuard")} />

            <div className="rounded-2xl bg-gradient-to-br from-[#efe6d6] to-[#f7efe3] p-[1px] shadow-md">
                <div className="rounded-2xl bg-[#fffbf3] p-6 sm:p-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-[#3b2a1d]">
                            {t("order.info", { defaultValue: "Customer Information" })}
                        </h3>
                        <p className="mt-1 text-sm text-[#857567]">
                            {t("order.info_hint", {
                                defaultValue: "We’ll use this to process your order and delivery.",
                            })}
                        </p>
                    </div>

                    {/* Grid fields */}
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="name"
                                className="flex items-center gap-2 text-sm font-medium text-[#3b2a1d]"
                            >
                                <Icon.User className="text-[#6b5545]" />
                                <span>
                  {t("order.name", { defaultValue: "Full Name" })}
                                    <span className="ml-1 text-red-500" aria-hidden>
                    *
                  </span>
                </span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                autoComplete="name"
                                placeholder={t("order.name_placeholder", {
                                    defaultValue: "e.g. Srey Neang",
                                })}
                                {...register("name", {
                                    required: "errors.name_required",
                                    minLength: { value: 2, message: "errors.name_short" },
                                })}
                                className={`${inputBase} ${errors.name ? errRing : okRing}`}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-600" role="alert">
                                    {t(errors.name.message, {
                                        defaultValue: ERR_DEFAULTS[errors.name.message],
                                    })}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="email"
                                className="flex items-center gap-2 text-sm font-medium text-[#3b2a1d]"
                            >
                                <Icon.Mail className="text-[#6b5545]" />
                                <span>
                  {t("order.email", { defaultValue: "Email" })}{" "}
                                    <span className="text-[#857567]">
                    {t("common.optional", { defaultValue: "(optional)" })}
                  </span>
                </span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder={t("order.email_placeholder", {
                                    defaultValue: "you@domain.com",
                                })}
                                {...register("email", {
                                    validate: (v) =>
                                        !v ||
                                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
                                        "errors.email_invalid",
                                })}
                                className={`${inputBase} ${errors.email ? errRing : okRing}`}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-600" role="alert">
                                    {t(errors.email.message, {
                                        defaultValue: ERR_DEFAULTS[errors.email.message],
                                    })}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="phone"
                                className="flex items-center gap-2 text-sm font-medium text-[#3b2a1d]"
                            >
                                <Icon.Phone className="text-[#6b5545]" />
                                <span>
                  {t("order.phone", { defaultValue: "Phone" })}
                                    <span className="ml-1 text-red-500" aria-hidden>
                    *
                  </span>
                </span>
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder={t("order.phone_placeholder", {
                                    defaultValue: "0XX XXX XXXX",
                                })}
                                {...register("phone", {
                                    required: "errors.phone_required",
                                    pattern: {
                                        value: KH_PHONE,
                                        message: "errors.phone_invalid",
                                    },
                                })}
                                className={`${inputBase} ${errors.phone ? errRing : okRing}`}
                            />
                            {errors.phone && (
                                <p className="text-xs text-red-600" role="alert">
                                    {t(errors.phone.message, {
                                        defaultValue: ERR_DEFAULTS[errors.phone.message],
                                    })}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Address picker */}
                    <div className="mt-5 space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-[#3b2a1d]">
                            <Icon.MapPin className="text-[#6b5545]" />
                            <span>
                {t("order.address", { defaultValue: "Address" })}
                                <span className="ml-1 text-red-500" aria-hidden>
                  *
                </span>
              </span>
                        </label>

                        <div
                            className={`rounded-xl border ${
                                errors.address ? "border-red-300" : "border-[#e7dbc9]"
                            } bg-[#fffaf3] p-3 shadow-sm`}
                        >
                            <AddressSelect
                                value={addr}
                                onChange={setAddr}
                                lang={L}
                                closeMenus={closeMenusFlag}
                            />

                            <div className="mt-3">
                                <label
                                    htmlFor="street"
                                    className="block text-xs font-medium text-[#3b2a1d] mb-1"
                                >
                                    {t("order.street", {
                                        defaultValue: "Street / House / Landmark",
                                    })}
                                </label>
                                <input
                                    id="street"
                                    type="text"
                                    placeholder={t("order.street_placeholder", {
                                        defaultValue: "Street 123, House 45, near market",
                                    })}
                                    value={addr?.street || ""}
                                    onChange={(e) =>
                                        setAddr((a) => ({ ...(a || {}), street: e.target.value }))
                                    }
                                    className="block w-full rounded-xl px-4 py-3 shadow-sm transition bg-[#fffaf3] text-[#3b2a1d] placeholder-[#9b8b7c] border focus:outline-none focus:ring-2 border-[#e7dbc9] focus:border-[#c9a44c] focus:ring-[#c9a44c]"
                                />
                                <p className="mt-1 text-[11px] text-[#857567]">
                                    {t("order.street_hint", {
                                        defaultValue:
                                            "Add nearest landmark or apartment for easier delivery.",
                                    })}
                                </p>
                            </div>

                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                {addr.province || addr.provinceName ? (
                                    <p className="text-xs text-[#6b5545]">
                                        {t("address.selected", { defaultValue: "Selected" })}:{" "}
                                        {selectedParts || "—"}
                                    </p>
                                ) : (
                                    <p className="text-xs text-[#6b5545]">
                                        {t("address.choose_hint", {
                                            defaultValue:
                                                "Choose province → district → commune → village.",
                                        })}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={handleUseLocation}
                                    disabled={geoBusy}
                                    className="inline-flex items-center gap-2 self-start rounded-lg border border-[#e7dbc9] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#3b2a1d] shadow-sm transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#c9a44c] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Icon.MapPin />
                                    {geoBusy
                                        ? t("address.locating", { defaultValue: "Locating…" })
                                        : t("address.use_current", {
                                            defaultValue: "Use current location",
                                        })}
                                </button>
                            </div>

                            <div className="mt-2">
                                <MiniMapPicker
                                    value={addr}
                                    onChange={setAddr}
                                    autoOpenOnGeo={openMapOnGeo}
                                />
                            </div>

                            {/* Confirm pin & accuracy hints */}
                            {addr?.geo && (
                                <label className="mt-2 flex items-start gap-2 text-xs text-[#3b2a1d]">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5"
                                        checked={!!addr.geoConfirmed}
                                        onChange={(e) =>
                                            setAddr((a) => ({ ...(a || {}), geoConfirmed: e.target.checked }))
                                        }
                                    />
                                    <span>
                    {t("address.confirm_pin", {
                        defaultValue:
                            "I confirm the map pin is on my exact delivery point",
                    })}
                  </span>
                                </label>
                            )}

                            {addr?.geo && !addr?.geoConfirmed && (
                                <p className="text-[11px] text-[#b56b00] mt-1">
                                    {t("address.pin_unconfirmed", {
                                        defaultValue:
                                            "Pin not confirmed or GPS accuracy is low (±{{m}}m). Please drag the pin or confirm.",
                                        m: Math.round(addr.geoAcc ?? 0),
                                    })}
                                </p>
                            )}
                        </div>

                        {addr?.geo?.lat && addr?.geo?.lng && (
                            <p className="text-[11px] text-[#857567]">
                                {t("address.pinned", { defaultValue: "Pinned" })}:{" "}
                                {addr.geo.lat.toFixed(5)}, {addr.geo.lng.toFixed(5)}
                                {typeof addr.geoAcc === "number" && <> • ±{Math.round(addr.geoAcc)}m</>}
                                {addr.geoSrc && <> • {addr.geoSrc}</>}
                            </p>
                        )}
                        {addr?.geoPreview && !addr?.geo && (
                            <p className="text-[11px] text-[#b56b00]">
                                {t("address.preview_inexact", {
                                    defaultValue:
                                        "This location may be off. Please place the pin on your address.",
                                })}
                            </p>
                        )}

                        {geoErrorKey && (
                            <p className="mt-1 text-xs text-red-600" role="alert">
                                {t(geoErrorKey)}
                            </p>
                        )}
                        {errors.address && (
                            <p className="text-xs text-red-600" role="alert">
                                {toErr(errors.address.message)}
                            </p>
                        )}
                    </div>

                    {/* Footer actions */}
                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={handleResetPress}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-red-600 to-red-700 px-5 py-3 font-medium text-white shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#c9a44c]"
                        >
                            <Icon.RotateCcw />{" "}
                            {t("common.reset", { defaultValue: "Reset" })}
                        </button>

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            aria-disabled={!canSubmit}
                            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#c9a44c] ${
                                canSubmit
                                    ? "bg-gradient-to-br from-[#4b2e24] to-[#2d1a14] text-white shadow-md"
                                    : "bg-[#e8dfd0] text-[#9b8b7c] cursor-not-allowed"
                            }`}
                        >
                            {isSubmitting ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                            ) : (
                                <Icon.ArrowRight />
                            )}
                            {t("common.next", { defaultValue: "Next" })}
                        </button>
                    </div>

                    <p className="mt-3 text-[11px] text-[#857567]">
                        {t("order.privacy_hint", {
                            defaultValue: "We’ll never share your info. Only email is optional.",
                        })}
                    </p>
                </div>
            </div>
        </form>
    );
}
