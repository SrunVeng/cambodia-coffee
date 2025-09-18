import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import RoutesView from './routes';
import CartDrawer from './components/cart/CartDrawer';

export default function App() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            {/* Leave room for the fixed/sticky header so content (and stepper) never hides behind it */}
            <main className="flex-1 pt-16 sm:pt-20">
                <RoutesView />
            </main>
            <Footer />
            <CartDrawer />
        </div>
    );
}
