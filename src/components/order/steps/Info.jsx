import { useForm } from 'react-hook-form'
import AddressSelect from '../AddressSelect'
import { useState } from 'react'

export default function Info({ data, onNext }){
    const { register, handleSubmit } = useForm({ defaultValues: data||{} })
    const [addr, setAddr] = useState(data?.address||{})

    const submit = (v)=> onNext?.({ ...v, address: addr })

    return (
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                <input className="badge w-full" placeholder="Name" {...register('name',{required:true})}/>
                <input className="badge w-full" placeholder="Email" {...register('email',{required:true})}/>
                <input className="badge w-full" placeholder="Phone" {...register('phone',{required:true})}/>
            </div>
            <AddressSelect value={addr} onChange={setAddr} />
            <button className="btn btn-primary">Next</button>
        </form>
    )
}
