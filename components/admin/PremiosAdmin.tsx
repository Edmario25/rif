'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Premio {
  id: string
  titulo: string
  descricao?: string
  ordem: number
  tipo: string
}

export function PremiosAdmin({ rifaId, initialPremios }: { rifaId: string; initialPremios: Premio[] }) {
  const [premios, setPremios] = useState<Premio[]>(initialPremios)
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState('sorteio')
  const { register, handleSubmit, reset } = useForm<{ titulo: string; descricao: string; ordem: number }>()

  async function onAdd(values: any) {
    setLoading(true)
    const res = await fetch('/api/premios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, tipo, rifa_id: rifaId, ordem: Number(values.ordem) }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setLoading(false); return }
    setPremios((p) => [...p, data])
    reset()
    toast.success('Prêmio adicionado!')
    setLoading(false)
  }

  async function onDelete(id: string) {
    const res = await fetch('/api/premios', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { setPremios((p) => p.filter((x) => x.id !== id)); toast.success('Prêmio removido.') }
    else toast.error('Erro ao remover.')
  }

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-lg">Prêmios da Rifa</h2>

      {/* Lista */}
      <div className="space-y-2">
        {premios.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium">{p.titulo}</p>
                <p className="text-xs text-muted-foreground">{p.tipo} · ordem {p.ordem}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onDelete(p.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {premios.length === 0 && <p className="text-sm text-muted-foreground">Nenhum prêmio cadastrado.</p>}
      </div>

      {/* Formulário adicionar */}
      <form onSubmit={handleSubmit(onAdd)} className="space-y-3 border rounded-lg p-4 bg-gray-50">
        <h3 className="font-medium text-sm">Adicionar prêmio</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Título do prêmio *" {...register('titulo', { required: true })} />
          <Input type="number" placeholder="Ordem (1, 2, 3…)" defaultValue={premios.length + 1} {...register('ordem')} />
        </div>
        <Textarea placeholder="Descrição (opcional)" rows={2} {...register('descricao')} />
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sorteio">🏆 Sorteio principal</SelectItem>
            <SelectItem value="conta_premiada">⭐ Conta Premiada</SelectItem>
            <SelectItem value="bonus">🎁 Bônus</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Adicionar prêmio
        </Button>
      </form>
    </div>
  )
}
