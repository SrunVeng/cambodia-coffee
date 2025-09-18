import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Info from "./steps/Info";
import Items from "./steps/Items";
import Review from "./steps/Review";
import Payment from "./steps/Payment";
import Stepper from "../../components/order/Stepper.jsx";
import { useCart } from "../../store/cart";

import {
    LS_KEYS,
    readJSON,
    writeJSON,
    i18nSteps,
    completedFromActive,
} from "../../utils/ui";

import { computeDeliveryFee } from "../../utils/distance"; // ← moved here

export default function CheckoutWizard() {
    const { t, i18n } = useTranslation();

    const [step, setStep] = useState(1); // 1=Info, 2=Items, 3=Review, 4=Payment
    const [info, setInfo] = useState(() => readJSON(LS_KEYS.INFO, {}));
    const [summary, setSummary] = useState(() => readJSON(LS_KEYS.SUMMARY, {}));

    const navigate = useNavigate();
    const clearCart = useCart((s) => s.clear);

    const steps = useMemo(() => i18nSteps(t, 4), [t]);
    const activeIdx = step - 1;
    const completedArr = completedFromActive(activeIdx, steps.length);

    // Delivery fee depends on customer info
    const deliveryFee = useMemo(() => computeDeliveryFee(info), [info]);

    const next = (patch = {}) => {
        if (step === 1) {
            setInfo(patch);
            writeJSON(LS_KEYS.INFO, patch);
        }
        if (step === 2) {
            const merged = { ...patch };
            if (merged.deliveryFee == null) merged.deliveryFee = deliveryFee;
            if (merged.total == null && merged.subtotal != null) {
                merged.total = Number(merged.subtotal) + Number(merged.deliveryFee || 0);
            }
            setSummary(merged);
            writeJSON(LS_KEYS.SUMMARY, merged);
        }
        setStep((s) => Math.min(4, s + 1));
    };

    const back = () => setStep((s) => Math.max(1, s - 1));

    const onPaid = ({ receipt }) => {
        writeJSON(LS_KEYS.RECEIPT, receipt || {});
        clearCart();
        navigate("/reciept");
    };

    const content = useMemo(() => {
        switch (step) {
            case 1:
                return <Info data={info} onNext={next} />;
            case 2:
                return (
                    <Items
                        currency="KHR"
                        deliveryFee={deliveryFee}
                        onNext={next}
                        onBack={back}
                    />
                );
            case 3:
                return (
                    <Review
                        info={info}
                        summary={summary}
                        onNext={next}
                        onBack={back}
                    />
                );
            case 4:
                return (
                    <Payment
                        info={info}
                        totals={summary}
                        onPaid={onPaid}
                        onBack={back}
                    />
                );
            default:
                return null;
        }
    }, [step, info, summary, deliveryFee]);

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-4">
            <div className="top-14 sm:top-20 z-30 -mx-4 px-4 py-12 mb-2">
                <Stepper
                    steps={steps}
                    lang={i18n.language}
                    active={activeIdx}
                    completed={completedArr}
                    maxReachable={activeIdx}
                    onStepClick={(i) => setStep(i + 1)}
                    size="md"
                    showPartial
                />
            </div>

            {content}
        </div>
    );
}
