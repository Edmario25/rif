import { RifaForm } from '@/components/admin/RifaForm'
import Link from 'next/link'
import { ChevronRight, Ticket } from 'lucide-react'

export default function NovaRifaPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <Link href="/admin/rifas" className="hover:text-slate-600">Rifas</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-600">Nova Rifa</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <Ticket className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Nova Rifa</h1>
            <p className="text-sm text-slate-500 mt-0.5">Os bilhetes serão gerados automaticamente ao criar.</p>
          </div>
        </div>
      </div>

      <RifaForm />
    </div>
  )
}
