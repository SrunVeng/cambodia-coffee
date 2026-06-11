import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

const Home = lazy(() => import('./pages/Home'))
const Products = lazy(() => import('./pages/Products'))
const Order = lazy(() => import('./pages/Order'))
const About = lazy(() => import('./pages/About'))

function PageFallback() {
    return <div className="min-h-[50vh]" aria-busy="true" />
}

export default function RoutesView() {
    return (
        <Suspense fallback={<PageFallback />}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/order" element={<Order />} />
                <Route path="/about" element={<About />} />
            </Routes>
        </Suspense>
    )
}
