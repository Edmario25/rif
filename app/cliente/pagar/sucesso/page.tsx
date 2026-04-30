'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Ticket, Share2 } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default function SucessoPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [pagamento, setPagamento] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/pagamento/status?id=${id}`)
      .then((r) => r.json())
      .then(setPagamento)
  }, [id])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Ícone animado */}
        <div className="flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 animate-bounce">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-800">Pagamento confirmado!</h1>
          <p className="text-slate-500">
            Seus bilhetes estão garantidos. Boa sorte no sorteio! 🍀
          </p>
        </div>

        {pagamento && (
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Valor pago</span>
              <span className="font-bold text-green-600">{formatCurrency(pagamento.valor)}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm text-slate-500 shrink-0">Seus bilhetes</span>
              <span className="text-sm font-semibold text-slate-800 text-right">
                {pagamento.numeros?.join(', ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Quantidade</span>
              <span className="font-semibold text-slate-800">{pagamento.numeros?.length}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link href="/cliente/meus-bilhetes"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-sm font-bold text-white shadow-md shadow-green-100 hover:bg-green-700 transition-all">
            <Ticket className="h-4 w-4" />
            Ver meus bilhetes
          </Link>
          <Link href="/"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
            <Share2 className="h-4 w-4" />
            Comprar mais bilhetes
          </Link>
        </div>

        <p className="text-xs text-slate-400">
          Você receberá uma confirmação no WhatsApp em instantes.
        </p>
      </div>
    </div>
  )
}
