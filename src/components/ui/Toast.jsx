import { motion, AnimatePresence } from "framer-motion"

export default function Toast({ message, show }) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed bottom-6 right-6 bg-[#2d1a14] text-white px-4 py-2 rounded-lg shadow-lg z-[100]"
                >
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
