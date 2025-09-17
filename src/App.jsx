import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import RoutesView from './routes'
import CartDrawer from './components/cart/CartDrawer'

export default function App(){
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
                <RoutesView />
            </main>
            <Footer />
            <CartDrawer />
        </div>
    )
}
