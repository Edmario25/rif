'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Plus, Minus, Zap, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface TicketSelectorProps {
  preco: number
  disponiveis: number
  rifaId: string
}

const PRESETS = [
  { qty: 10,  label: '+10' },
  { qty: 25,  label: '+25' },
  { qty: 50,  label: '+50',  popular: true },
  { qty: 100, label: '+100' },
  { qty: 200, label: '+200' },
  { qty: 500, label: '+500' },
]

export function TicketSelector({ preco, disponiveis, rifaId }: TicketSelectorProps) {
  const router = useRouter()
  const [qty, setQty] = useState(50)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  function add(n: number) {
    setQty((q) => Math.min(q + n, disponiveis || 9999))
  }
  function sub(n: number) {
    setQty((q) => Math.max(q - n, 1))
  }
  function setExact(n: number) {
    setQty(Math.max(1, Math.min(n, disponiveis || 9999)))
  }

  const total = Number((qty * preco).toFixed(2))

  async function handleComprar() {
    setErro('')
    setLoading(true)

    try {
      // Verifica se está logado
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Salva qty na session para retornar depois do login
        sessionStorage.setItem('pix_qty', String(qty))
        sessionStorage.setItem('pix_rifa', rifaId)
        router.push('/login')
        return
      }

      // Cria pagamento
      const res = await fetch('/api/pagamento/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rifa_id: rifaId, qty }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErro(data.error || 'Erro ao criar pagamento.')
        return
      }

      // Salva QR code na session para a página de pagamento
      sessionStorage.setItem(`pix_${data.pagamento_id}`, JSON.stringify({
        qr_code: data.qr_code,
        qr_code_base64: data.qr_code_base64,
      }))

      router.push(`/cliente/pagar?id=${data.pagamento_id}`)
    } catch (e: any) {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Preço unitário */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-green-600">{formatCurrency(preco)}</span>
        <span className="text-slate-500 text-sm">por bilhete</span>
      </div>

      {/* Botões rápidos */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quantidade rápida</p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map(({ qty: q, label, popular }) => (
            <button
              key={q}
              onClick={() => add(q)}
              disabled={loading}
              className={[
                'relative flex items-center justify-center rounded-xl border-2 py-3 text-sm font-bold transition-all disabled:opacity-50',
                popular
                  ? 'border-green-500 bg-green-500 text-white shadow-md shadow-green-200'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-green-400 hover:bg-green-50',
              ].join(' ')}
            >
              {popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-bold text-white shadow">
                  MAIS POPULAR
                </span>
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Controle manual */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quantidade selecionada</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => sub(1)}
            disabled={loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-600 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min={1}
            max={disponiveis || 9999}
            value={qty}
            onChange={(e) => setExact(Number(e.target.value))}
            disabled={loading}
            className="h-11 w-full rounded-xl border-2 border-green-400 bg-white text-center text-xl font-bold text-slate-800 focus:outline-none focus:border-green-500 disabled:opacity-50"
          />
          <button
            onClick={() => add(1)}
            disabled={loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-600 hover:border-green-400 hover:text-green-600 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="rounded-2xl bg-green-50 border border-green-100 p-4 space-y-1">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{qty} bilhete{qty > 1 ? 's' : ''} × {formatCurrency(preco)}</span>
          <span className="font-bold text-slate-800 text-base">{formatCurrency(total)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-700">
          <Zap className="h-3 w-3" />
          Bilhetes liberados após confirmação do pagamento
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-600">
          {erro}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleComprar}
        disabled={loading || disponiveis === 0}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-green-600 py-4 text-base font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Aguarde…</>
        ) : disponiveis === 0 ? (
          'Esgotado'
        ) : (
          <><ShoppingCart className="h-5 w-5" /> Garantir {qty} bilhete{qty > 1 ? 's' : ''} — {formatCurrency(total)}</>
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        🔒 Pagamento 100% seguro via PIX
      </p>
    </div>
  )
}
