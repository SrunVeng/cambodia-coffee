import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import Info from "./steps/Info"
import Items from "./steps/Items"
import Review from "./steps/Review"
import Payment from "./steps/Payment"
import Stepper from "../../components/order/Stepper.jsx"
import LeaveGuard from "../ui/LeaveGuard.jsx"
import { useToast } from "../ui/ToastHub.jsx"
import { useCart } from "../../store/cart"

import {
    LS_KEYS,
    readJSON,
    writeJSON,
    i18nSteps,
    completedFromActive,
} from "../../utils/ui"

import { computeDeliveryFee } from "../../utils/distance"

export default function CheckoutWizard() {
    const { t, i18n } = useTranslation()
    const toast = useToast()

    const [step, setStep] = useState(1)
    const [info, setInfo] = useState(() => readJSON(LS_KEYS.INFO, {}))
    const [summary, setSummary] = useState(() => readJSON(LS_KEYS.SUMMARY, {}))
    const [lastVisited, setLastVisited] = useState(null)

    const [confirmResetOpen, setConfirmResetOpen] = useState(false)

    const navigate = useNavigate()
    const clearCart = useCart((s) => s.clear)
    const cartItems = useCart((s) => s.items)

    const steps = useMemo(() => i18nSteps(t, 4), [t])
    const activeIdx = step - 1
    const completedArr = completedFromActive(activeIdx, steps.length)

    const deliveryFee = useMemo(() => computeDeliveryFee(info), [info])

    // Validation for each step
    const isStepValid = (idx) => {
        if (idx === 0) return !!info?.name && !!info?.phone && info?.address?.province
        if (idx === 1) return cartItems.length > 0
        if (idx === 2) return !!summary?.total && summary?.items?.length > 0
        if (idx === 3) return true
        return false
    }

    const reachable = steps.map((_, i) => {
        if (i <= activeIdx) return true
        return steps.slice(0, i).every((_, j) => isStepValid(j))
    })

    const next = (patch = {}) => {
        if (step === 1) {
            setInfo(patch)
            writeJSON(LS_KEYS.INFO, patch)
        }
        if (step === 2) {
            const merged = { ...patch }
            if (merged.deliveryFee == null) merged.deliveryFee = deliveryFee
            if (merged.total == null && merged.subtotal != null) {
                merged.total = Number(merged.subtotal) + Number(merged.deliveryFee || 0)
            }
            setSummary(merged)
            writeJSON(LS_KEYS.SUMMARY, merged)
        }
        setLastVisited(step - 1)
        setStep((s) => Math.min(4, s + 1))
    }

    const back = () => {
        setLastVisited(step - 1)
        setStep((s) => Math.max(1, s - 1))
    }

    const onPaid = ({ receipt }) => {
        writeJSON(LS_KEYS.RECEIPT, receipt || {})
        clearCart()
        navigate("/reciept")
    }

    // ---- RESET LOGIC ----
    const doReset = () => {
        // clear app state
        setInfo({})
        setSummary({})
        setStep(1)
        setLastVisited(null)

        // clear persisted
        writeJSON(LS_KEYS.INFO, {})
        writeJSON(LS_KEYS.SUMMARY, {})
        writeJSON(LS_KEYS.RECEIPT, {})

        // clear cart items
        clearCart()

        // close dialog + toast
        setConfirmResetOpen(false)
        toast(t("order.reset.done", { defaultValue: "Order has been reset." }))
    }

    const content = useMemo(() => {
        switch (step) {
            case 1:
                return (
                    <Info
                        data={info}
                        onNext={next}
                        onResetClick={() => setConfirmResetOpen(true)}
                    />
                )
            case 2:
                return (
                    <Items
                        currency="KHR"
                        deliveryFee={deliveryFee}
                        onNext={next}
                        onBack={back}
                        onResetClick={() => setConfirmResetOpen(true)}
                    />
                )
            case 3:
                return (
                    <Review
                        info={info}
                        summary={summary}
                        onNext={next}
                        onBack={back}
                        onResetClick={() => setConfirmResetOpen(true)}
                    />
                )
            case 4:
                return (
                    <Payment
                        info={info}
                        totals={summary}
                        onPaid={onPaid}
                        onBack={back}
                        onResetClick={() => setConfirmResetOpen(true)}
                    />
                )
            default:
                return null
        }
    }, [step, info, summary, deliveryFee]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-4">
            {/* Stepper */}
            <div className="top-14 sm:top-20 z-30 -mx-4 px-4 py-12 mb-2">
                <Stepper
                    steps={steps}
                    lang={i18n.language}
                    active={activeIdx}
                    completed={completedArr}
                    reachable={reachable}
                    lastVisited={lastVisited}
                    onStepClick={(i) => {
                        if (reachable[i]) {
                            setLastVisited(step - 1)
                            setStep(i + 1)
                        }
                    }}
                    size="md"
                    showPartial
                />
            </div>

            {content}

            {/* LeaveGuard confirm dialog */}
            <LeaveGuard
                open={confirmResetOpen}
                danger
                title={t("order.reset.title", { defaultValue: "Reset order?" })}
                hint={t("order.reset.hint", {
                    defaultValue: "This will clear contact info, address, items, and totals.",
                })}
                confirmLabel={t("common.confirm", { defaultValue: "Confirm" })}
                cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
                onConfirm={doReset}
                onCancel={() => setConfirmResetOpen(false)}
                closeOnBackdrop
                initialFocus="cancel"
            />
        </div>
    )
}
