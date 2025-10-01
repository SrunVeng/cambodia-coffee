import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Products from './pages/Products'
import Order from './pages/Order'
import About from './pages/About'
import Contact  from './pages/Contact.jsx'
import Confirm from './pages/Confirm.jsx'
import Receipt from "./components/order/steps/Receipt.jsx";

export default function RoutesView(){
    return (
        <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/products" element={<Products/>} />
            <Route path="/order" element={<Order/>} />
            <Route path="/about" element={<About/>} />
            <Route path="/contact" element={<Contact/>} />
            <Route path="/receipt" element={<Receipt/>} />
        </Routes>
    )
}
