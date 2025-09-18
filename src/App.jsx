import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import RoutesView from './routes';
import CartDrawer from './components/cart/CartDrawer';
import ToastHub from "./components/ui/ToastHub.jsx";

export default function App() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            {/* Leave room for the fixed/sticky header so content (and stepper) never hides behind it */}
            <main className="flex-1">
                <RoutesView />
            </main>
            <Footer />
            <CartDrawer />
            <ToastHub />
        </div>
    );
}
