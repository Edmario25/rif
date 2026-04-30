'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Star } from 'lucide-react'

interface ContaPremiada {
  id: string
  numero_bilhete: number
  descricao_premio: string
  ativo: boolean
}

interface Props {
  rifaId: string
  totalBilhetes: number
  initialContas: ContaPremiada[]
}

export function ContasPremiadasAdmin({ rifaId, totalBilhetes, initialContas }: Props) {
  const [contas, setContas] = useState<ContaPremiada[]>(initialContas)
  const [selected, setSelected] = useState<number | null>(null)
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)

  const contaMap = new Map(contas.map((c) => [c.numero_bilhete, c]))

  async function handleClick(numero: number) {
    const existente = contaMap.get(numero)
    if (existente) {
      // Toggle ativo/inativo
      setLoading(true)
      const res = await fetch('/api/contas-premiadas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: existente.id, ativo: !existente.ativo }),
      })
      if (res.ok) {
        setContas((prev) => prev.map((c) => c.id === existente.id ? { ...c, ativo: !c.ativo } : c))
        toast.success(existente.ativo ? 'Conta premiada desativada.' : 'Conta premiada ativada!')
      }
      setLoading(false)
    } else {
      setSelected(numero)
      setDescricao('')
    }
  }

  async function handleConfirmar() {
    if (!selected || !descricao.trim()) return
    setLoading(true)
    const res = await fetch('/api/contas-premiadas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rifa_id: rifaId, numero_bilhete: selected, descricao_premio: descricao }),
    })
    const data = await res.json()
    if (res.ok) {
      setContas((prev) => [...prev, data])
      toast.success(`Bilhete #${selected} marcado como conta premiada!`)
    } else {
      toast.error(data.error)
    }
    setSelected(null)
    setLoading(false)
  }

  const ativasCount = contas.filter((c) => c.ativo).length

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Info */}
      <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3 text-sm text-yellow-800">
        <p className="font-medium">Como usar</p>
        <p className="text-xs mt-0.5 text-yellow-700">Clique em um número para marcá-lo como conta premiada. Clique novamente para ativar/desativar.</p>
      </div>

      {/* Grade de bilhetes */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Selecione os bilhetes premiados</h2>
          <span className="text-xs text-slate-400">{ativasCount} conta{ativasCount !== 1 ? 's' : ''} ativa{ativasCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: totalBilhetes }, (_, i) => i + 1).map((n) => {
            const conta = contaMap.get(n)
            return (
              <button
                key={n}
                type="button"
                onClick={() => handleClick(n)}
                disabled={loading}
                className={cn(
                  'relative flex h-10 w-full items-center justify-center rounded border text-xs font-medium transition-colors',
                  conta?.ativo ? 'bg-yellow-400 border-yellow-500 text-yellow-900'
                  : conta ? 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                  : 'bg-white border-slate-200 hover:border-yellow-400 hover:bg-yellow-50'
                )}
              >
                {conta?.ativo && <Star className="absolute top-0.5 right-0.5 h-2 w-2 fill-yellow-700 text-yellow-700" />}
                {n}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista das contas premiadas */}
      {contas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Contas configuradas</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {contas.map((c) => (
              <div key={c.id} className={cn('flex items-center justify-between px-5 py-3', !c.ativo && 'opacity-40')}>
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', c.ativo ? 'bg-yellow-50' : 'bg-slate-100')}>
                    <Star className={cn('h-3.5 w-3.5', c.ativo ? 'text-yellow-500' : 'text-slate-400')} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Bilhete #{c.numero_bilhete}</p>
                    <p className="text-xs text-slate-400">{c.descricao_premio}</p>
                  </div>
                </div>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', c.ativo ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400')}>
                  {c.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog para descrição */}
      <Dialog open={selected !== null} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar bilhete #{selected} como conta premiada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Descrição do prêmio (ex: R$ 500 em espécie)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="border-slate-200"
            />
            <div className="flex gap-2">
              <Button onClick={handleConfirmar} disabled={!descricao.trim() || loading}
                className="bg-green-600 hover:bg-green-700">
                Confirmar
              </Button>
              <Button variant="outline" className="border-slate-200" onClick={() => setSelected(null)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
