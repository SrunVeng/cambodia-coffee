import { useCallback, useEffect, useRef, useState } from "react"
import Toast from "./Toast"

export default function ToastHub() {
    const [message, setMessage] = useState("")
    const [show, setShow] = useState(false)
    const timerRef = useRef(null)

    useEffect(() => {
        const handler = (e) => {
            const { message = "", duration = 1600 } = (e.detail || {})
            setMessage(message)
            setShow(true)
            if (timerRef.current) window.clearTimeout(timerRef.current)
            timerRef.current = window.setTimeout(() => setShow(false), duration)
        }
        window.addEventListener("app:toast", handler)
        return () => {
            window.removeEventListener("app:toast", handler)
            if (timerRef.current) window.clearTimeout(timerRef.current)
        }
    }, [])

    return <Toast message={message} show={show} />
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    return useCallback((message, duration = 1600) => {
        window.dispatchEvent(new CustomEvent("app:toast", { detail: { message, duration } }))
    }, [])
}
