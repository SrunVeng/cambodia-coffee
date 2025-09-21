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

// ✅ Cambodia mobile/landline (no country code), 9–10 digits total with leading 0
const KH_PHONE = /^0[1-9]\d{7,8}$/

export default function CheckoutWizard() {
    const { t, i18n } = useTranslation()
    const toast = useToast()

    const [step, setStep] = useState(1)
    const [info, setInfo] = useState(() => readJSON(LS_KEYS.INFO, {}))
    const [summary, setSummary] = useState(() => readJSON(LS_KEYS.SUMMARY, {}))
    const [lastVisited, setLastVisited] = useState(null)
    const [confirmResetOpen, setConfirmResetOpen] = useState(false)

    // Live draft for Step 1 and its validity
    const [infoDraft, setInfoDraft] = useState(info)
    const [step1Valid, setStep1Valid] = useState(false)

    const navigate = useNavigate()
    const clearCart = useCart((s) => s.clear)
    const cartItems = useCart((s) => s.items)

    const steps = useMemo(() => i18nSteps(t, 4), [t])
    const activeIdx = step - 1
    const completedArr = completedFromActive(activeIdx, steps.length)

    // Use the live draft while on step 1 so going back keeps values
    const liveInfo = step === 1 ? infoDraft : info
    const deliveryFee = useMemo(() => computeDeliveryFee(liveInfo), [liveInfo])

    // ✅ Validation for each step (STRICT address + strict phone format)
    const isStepValid = (idx) => {
        if (idx === 0) {
            const src = liveInfo
            const a = src?.address || {}
            const phoneOk = KH_PHONE.test(String(src?.phone ?? "").trim())
            const nameOk = !!src?.name // (you can enforce min length if desired)
            const addressOk = !!(a.province && a.district && a.commune && a.village)
            return nameOk && phoneOk && addressOk
        }
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

    // RESET
    const doReset = () => {
        setInfo({})
        setSummary({})
        setStep(1)
        setLastVisited(null)
        setInfoDraft({})
        setStep1Valid(false)

        writeJSON(LS_KEYS.INFO, {})
        writeJSON(LS_KEYS.SUMMARY, {})
        writeJSON(LS_KEYS.RECEIPT, {})

        clearCart()
        setConfirmResetOpen(false)
        toast(t("order.reset.done", { defaultValue: "Order has been reset." }))
    }

    const content = useMemo(() => {
        switch (step) {
            case 1:
                return (
                    <Info
                        data={liveInfo}
                        onNext={next}
                        onResetClick={() => setConfirmResetOpen(true)}
                        // ✅ Recompute validity here to keep wizard as the single source of truth
                        onProgress={(draft) => {
                            setInfoDraft(draft || {})
                            const a = draft?.address || {}
                            const phoneOk = KH_PHONE.test(String(draft?.phone ?? "").trim())
                            const nameOk = !!draft?.name
                            const addressOk = !!(a.province && a.district && a.commune && a.village)
                            setStep1Valid(nameOk && phoneOk && addressOk)
                        }}
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

    // Pulse cue on next reachable step (uses stricter step1Valid now)
    const advanceCue = step === 1 ? step1Valid : reachable[activeIdx + 1]

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
                        if (!reachable[i]) return
                        setLastVisited(step - 1)

                        // If leaving step 1 via stepper and draft is valid, persist it
                        if (step === 1 && i >= 1 && step1Valid && infoDraft) {
                            setInfo(infoDraft)
                            writeJSON(LS_KEYS.INFO, infoDraft)
                        }

                        setStep(i + 1)
                    }}
                    size="md"
                    showPartial
                    advanceCue={!!advanceCue}
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
