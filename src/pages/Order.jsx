// src/pages/Order.jsx
// import CheckoutWizard from "../components/order/CheckoutWizard.jsx";
import QrOrder from "../components/order/QrOrder.jsx";

export default function Order() {
    return (
        <div className="max-w-5xl mx-auto p-4">
            {/* <CheckoutWizard /> */}
            <QrOrder />
        </div>
    );
}
