'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Trophy } from 'lucide-react'
import { toast } from 'sonner'

interface Rifa { id: string; titulo: string }
interface Premio { id: string; titulo: string }

interface PremiadoFormProps {
  rifas: Rifa[]
  onSuccess: (ganhador: any) => void
}

export function PremiadoForm({ rifas, onSuccess }: PremiadoFormProps) {
  const [rifaId, setRifaId] = useState('')
  const [premioId, setPremioId] = useState('')
  const [premios, setPremios] = useState<Premio[]>([])
  const [publicar, setPublicar] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset } = useForm<{ numero_sorteado: number; observacao: string }>()

  async function onRifaChange(id: string) {
    setRifaId(id)
    const res = await fetch(`/api/premios?rifa_id=${id}`)
    const data = await res.json()
    setPremios(data || [])
  }

  async function onSubmit(values: any) {
    if (!rifaId) { toast.error('Selecione a rifa'); return }
    setLoading(true)
    const res = await fetch('/api/premiados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, rifa_id: rifaId, premio_id: premioId || null, publicar }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setLoading(false); return }
    toast.success('Ganhador registrado!')
    onSuccess(data)
    reset()
    setRifaId('')
    setPremioId('')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border rounded-lg p-4 bg-gray-50 max-w-lg">
      <h3 className="font-semibold flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" />Registrar Ganhador</h3>

      <Select value={rifaId} onValueChange={onRifaChange}>
        <SelectTrigger><SelectValue placeholder="Selecionar rifa *" /></SelectTrigger>
        <SelectContent>
          {rifas.map((r) => <SelectItem key={r.id} value={r.id}>{r.titulo}</SelectItem>)}
        </SelectContent>
      </Select>

      <Input type="number" placeholder="Número sorteado *" {...register('numero_sorteado', { required: true, valueAsNumber: true })} />

      {premios.length > 0 && (
        <Select value={premioId} onValueChange={setPremioId}>
          <SelectTrigger><SelectValue placeholder="Prêmio (opcional)" /></SelectTrigger>
          <SelectContent>
            {premios.map((p) => <SelectItem key={p.id} value={p.id}>{p.titulo}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      <Textarea placeholder="Observação (opcional)" rows={2} {...register('observacao')} />

      <div className="flex items-center gap-2">
        <Switch id="publicar" checked={publicar} onCheckedChange={setPublicar} />
        <Label htmlFor="publicar">Publicar na página pública</Label>
      </div>

      <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Registrar ganhador
      </Button>
    </form>
  )
}
