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

export default function CheckoutWizard() {
    const { t, i18n } = useTranslation();

    // steps: 1=Info, 2=Items, 3=Review, 4=Payment
    const [step, setStep] = useState(1);
    const [info, setInfo] = useState(() => readJSON(LS_KEYS.INFO, {}));
    const [summary, setSummary] = useState(() => readJSON(LS_KEYS.SUMMARY, {}));

    const navigate = useNavigate();
    const clearCart = useCart((s) => s.clear);

    // translated step labels (first 4 for the wizard)
    const steps = useMemo(() => i18nSteps(t, 4), [t]);
    const activeIdx = step - 1;
    const completedArr = completedFromActive(activeIdx, steps.length);

    const next = (patch = {}) => {
        if (step === 1) {
            setInfo(patch);
            writeJSON(LS_KEYS.INFO, patch);
        }
        if (step === 2) {
            setSummary(patch);
            writeJSON(LS_KEYS.SUMMARY, patch);
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
                return <Items currency="KHR" deliveryFee={0} onNext={next} onBack={back} />;
            case 3:
                return <Review info={info} summary={summary} onNext={next} onBack={back} />;
            case 4:
                return <Payment info={info} totals={summary} onPaid={onPaid} onBack={back} />;
            default:
                return null;
        }
    }, [step, info, summary]);

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-4">
            {/* Sticky stepper under the navbar — fully transparent wrapper */}
            <div
                className="top-14 sm:top-20 z-30 bg-transparent py-1 mb-2"
                style={{ backgroundColor: "transparent" }}
            >
                <Stepper
                    steps={steps}
                    lang={i18n.language}
                    active={activeIdx}
                    completed={completedArr}
                    maxReachable={activeIdx}            // allow going back only
                    onStepClick={(i) => setStep(i + 1)} // i is 0-based
                    size="md"
                    showPartial
                />
            </div>

            {content}
        </div>
    );
}
