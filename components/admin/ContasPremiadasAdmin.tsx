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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-semibold text-lg">Contas Premiadas</h2>
        <span className="text-sm text-muted-foreground">
          {contas.filter((c) => c.ativo).length} configuradas
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Clique em um número para marcá-lo como conta premiada. Clique novamente para ativar/desativar.
      </p>

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
                : conta ? 'bg-gray-200 border-gray-300 text-gray-400 line-through'
                : 'bg-white border-gray-200 hover:border-yellow-400 hover:bg-yellow-50'
              )}
            >
              {conta?.ativo && <Star className="absolute top-0.5 right-0.5 h-2 w-2 fill-yellow-700 text-yellow-700" />}
              {n}
            </button>
          )
        })}
      </div>

      {/* Lista das contas premiadas */}
      {contas.length > 0 && (
        <div className="space-y-2 mt-4">
          <h3 className="text-sm font-medium">Contas configuradas</h3>
          {contas.map((c) => (
            <div key={c.id} className={cn('flex items-center justify-between rounded-lg border px-3 py-2 text-sm', !c.ativo && 'opacity-50')}>
              <span><strong>#{c.numero_bilhete}</strong> — {c.descricao_premio}</span>
              <span className={cn('text-xs font-medium', c.ativo ? 'text-green-600' : 'text-gray-400')}>
                {c.ativo ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          ))}
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
            />
            <div className="flex gap-2">
              <Button onClick={handleConfirmar} disabled={!descricao.trim() || loading}
                className="bg-green-600 hover:bg-green-700">
                Confirmar
              </Button>
              <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
