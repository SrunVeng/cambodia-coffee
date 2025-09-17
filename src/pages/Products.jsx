import { useState } from 'react'
import ProductFilterSort from '../components/products/ProductFilterSort'
import ProductGrid from '../components/products/ProductGrid'
import { useTranslation } from 'react-i18next'

export default function Products(){
    const { t } = useTranslation()
    const [filter, setFilter] = useState({ category:'all', sort:'popular' })

    return (
        <section className="section">
            <div className="container-narrow space-y-6">
                <h2>{t('products.title')}</h2>
                <ProductFilterSort onChange={setFilter} />
                <ProductGrid filter={filter} />
            </div>
        </section>
    )
}
