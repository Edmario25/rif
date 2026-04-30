'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Loader2, Trophy, Star, Gift } from 'lucide-react'
import { toast } from 'sonner'

interface Premio {
  id: string
  titulo: string
  descricao?: string
  ordem: number
  tipo: string
}

const tipoMap: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  sorteio:        { label: 'Sorteio principal', icon: <Trophy className="h-3.5 w-3.5" />, cls: 'bg-yellow-50 text-yellow-700' },
  conta_premiada: { label: 'Conta Premiada',   icon: <Star className="h-3.5 w-3.5" />,   cls: 'bg-blue-50 text-blue-700' },
  bonus:          { label: 'Bônus',            icon: <Gift className="h-3.5 w-3.5" />,   cls: 'bg-purple-50 text-purple-700' },
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
    if (res.ok) {
      setPremios((p) => p.filter((x) => x.id !== id))
      toast.success('Prêmio removido.')
    } else {
      toast.error('Erro ao remover.')
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Lista de prêmios */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base">Prêmios cadastrados</CardTitle>
          </div>
          <CardDescription>{premios.length === 0 ? 'Nenhum prêmio ainda.' : `${premios.length} prêmio${premios.length > 1 ? 's' : ''} cadastrado${premios.length > 1 ? 's' : ''}.`}</CardDescription>
        </CardHeader>
        <CardContent>
          {premios.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
                <Trophy className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Nenhum prêmio cadastrado.</p>
              <p className="text-xs text-slate-400 mt-0.5">Use o formulário abaixo para adicionar.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {premios.map((p, i) => {
                const t = tipoMap[p.tipo] || tipoMap.sorteio
                return (
                  <div key={p.id} className={`flex items-center justify-between py-3 ${i === 0 ? '' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 shrink-0">
                        {t.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{p.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={`${t.cls} border-0 text-xs px-1.5 py-0`}>{t.label}</Badge>
                          <span className="text-xs text-slate-400">#{p.ordem}</span>
                        </div>
                        {p.descricao && <p className="text-xs text-slate-400 mt-0.5">{p.descricao}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário adicionar */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base">Adicionar prêmio</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Título *</label>
                <Input placeholder="Ex: Smartphone Samsung S24" className="border-slate-200"
                  {...register('titulo', { required: true })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Ordem</label>
                <Input type="number" placeholder="1" defaultValue={premios.length + 1}
                  className="border-slate-200" {...register('ordem')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Descrição</label>
              <Textarea placeholder="Detalhes do prêmio (opcional)" rows={2}
                className="border-slate-200 resize-none" {...register('descricao')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Tipo</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sorteio">🏆 Sorteio principal</SelectItem>
                  <SelectItem value="conta_premiada">⭐ Conta Premiada</SelectItem>
                  <SelectItem value="bonus">🎁 Bônus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Adicionar prêmio
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
