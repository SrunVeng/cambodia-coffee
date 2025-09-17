import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Stepper from "../components/order/Stepper";
import Info from "../components/order/steps/Info";
import Items from "../components/order/steps/Items";
import Review from "../components/order/steps/Review";
import Payment from "../components/order/steps/Payment";
import Receipt from "../components/order/steps/Receipt";
import { useCart } from "../store/cart";
import { kmDistance, deliveryFeeByKm } from "../utils/distance";
import data from "../data/data.json";
import { useTranslation } from "react-i18next";

export default function Order() {
    const { t, i18n } = useTranslation();

    // Steps displayed in the Stepper (Receipt is NOT part of the stepper)
    const steps = useMemo(() => {
        const raw = t("order.steps", { returnObjects: true });
        if (Array.isArray(raw) && raw.length > 0) return raw;
        return ["Cart", "Delivery", "Review", "Payment"]; // fallback
    }, [t, i18n.language]);

    const [step, setStep] = useState(0);
    const [completed, setCompleted] = useState(() => Array(4).fill(false)); // default 4, replaced below
    const [info, setInfo] = useState({});
    const [totals, setTotals] = useState({});
    const [receipt, setReceipt] = useState(null);

    const items = useCart((s) => s.items);
    const clear = useCart((s) => s.clear);

    // Keep completed[] in sync with steps length
    useEffect(() => {
        setCompleted((prev) => {
            const next = Array(steps.length).fill(false);
            for (let i = 0; i < Math.min(prev.length, next.length); i++) next[i] = prev[i];
            return next;
        });
        setStep((s) => Math.min(Math.max(s, 0), Math.max(steps.length - 1, 0)));
    }, [steps.length]);

    /** Provinces cache */
    const provincesRef = useRef(null);
    const provincesLoadingRef = useRef(false);

    const loadProvinces = useCallback(async () => {
        if (provincesRef.current || provincesLoadingRef.current) return;
        provincesLoadingRef.current = true;
        try {
            const resp = await fetch("/address/provinces.json");
            const provs = await resp.json();
            provincesRef.current = Array.isArray(provs?.provinces) ? provs.provinces : provs;
        } catch (e) {
            console.error("Failed to load provinces.json", e);
            provincesRef.current = [];
        } finally {
            provincesLoadingRef.current = false;
        }
    }, []);

    useEffect(() => {
        loadProvinces();
    }, [loadProvinces]);

    // compute delivery fee using province center coords (dynamic by distance)
    const computeDeliveryFee = useCallback(
        async (address) => {
            if (!address?.province) return 0;
            if (!provincesRef.current) await loadProvinces();

            const list = provincesRef.current || [];
            const p = list.find((x) => x.code === address.province);
            if (!p) return 0;

            const km = kmDistance(
                { lat: data.WAREHOUSE_COORDS.lat, lng: data.WAREHOUSE_COORDS.lng },
                { lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) }
            );
            return deliveryFeeByKm(km);
        },
        [loadProvinces]
    );

    const currency = data?.CURRENCY || "USD";

    // Highest unlocked step = last completed + 1
    const lastDoneIndex = Math.max(-1, ...completed.map((v, i) => (v ? i : -1)));
    const maxReachable = Math.min(lastDoneIndex + 1, steps.length - 1);

    // Clamp active step if it somehow gets ahead of unlocked
    useEffect(() => {
        setStep((s) => Math.min(s, maxReachable));
    }, [maxReachable]);

    const handleStepClick = useCallback(
        (i) => {
            if (i <= maxReachable) setStep(i); // back or unlocked step only
        },
        [maxReachable]
    );

    const markDoneAndGo = useCallback(
        (iNext) => {
            setCompleted((prev) => {
                const next = [...prev];
                const justFinished = Math.max(0, iNext - 1); // finished current before moving on
                next[justFinished] = true;
                return next;
            });
            setStep(iNext);
        },
        []
    );

    const goPaid = useCallback(
        (res) => {
            setCompleted((prev) => {
                const next = [...prev];
                next[steps.length - 1] = true; // Payment completed
                return next;
            });
            setReceipt(res?.receipt ?? null);
            clear();
            // Keep step at last index (Payment) while showing receipt below (or navigate elsewhere if you prefer)
            setStep(steps.length - 1);
        },
        [clear, steps.length]
    );

    return (
        <section className="section">
            <div className="container-narrow space-y-6">
                <h2 className="text-xl sm:text-2xl font-semibold">{t("order.title")}</h2>

                <Stepper
                    steps={steps}
                    active={step}
                    completed={completed}      // completed steps turn brown
                    maxReachable={maxReachable} // only unlocked steps are clickable
                    onStepClick={handleStepClick}
                />

                {/* Step 0: Info */}
                {step === 0 && (
                    <Info
                        data={info}
                        onNext={async (v) => {
                            const fee = await computeDeliveryFee(v.address);
                            setInfo(v);
                            setTotals((s) => ({
                                ...s,
                                deliveryFee: fee,
                                items,
                                currency,
                            }));
                            markDoneAndGo(1); // unlock step 1
                        }}
                    />
                )}

                {/* Step 1: Items */}
                {step === 1 && (
                    <Items
                        deliveryFee={totals.deliveryFee || 0}
                        onBack={() => setStep(0)}
                        onNext={({ subtotal, total }) => {
                            setTotals((s) => ({ ...s, subtotal, total, items, currency }));
                            markDoneAndGo(2); // unlock step 2
                        }}
                    />
                )}

                {/* Step 2: Review */}
                {step === 2 && (
                    <Review
                        info={info}
                        summary={totals}
                        onBack={() => setStep(1)}
                        onNext={() => markDoneAndGo(3)} // unlock step 3
                    />
                )}

                {/* Step 3: Payment */}
                {step === 3 && (
                    <Payment info={info} totals={totals} onBack={() => setStep(2)} onPaid={goPaid} />
                )}

                {/* Receipt is shown after payment succeeds (not part of the stepper) */}
                {receipt && (
                    <Receipt
                        receipt={receipt}
                        onReset={() => {
                            setStep(0);
                            setReceipt(null);
                            setCompleted(Array(steps.length).fill(false));
                        }}
                    />
                )}
            </div>
        </section>
    );
}
