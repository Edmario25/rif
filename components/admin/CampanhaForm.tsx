'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, Megaphone } from 'lucide-react'
import { toast } from 'sonner'

interface Rifa { id: string; titulo: string }

const VARIAVEIS = ['{{nome}}', '{{numeros}}', '{{rifa}}', '{{data_sorteio}}']

interface CampanhaFormProps {
  rifas: Rifa[]
  onSuccess: (campanha: any) => void
}

export function CampanhaForm({ rifas, onSuccess }: CampanhaFormProps) {
  const [rifaId, setRifaId] = useState('')
  const [tipo, setTipo] = useState('todos')
  const [mensagem, setMensagem] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset } = useForm<{ titulo: string; agendado_para: string }>()

  function insertVar(v: string) {
    setMensagem((m) => m + v)
  }

  async function onSubmit(values: any) {
    if (!mensagem.trim()) { toast.error('A mensagem não pode ser vazia.'); return }
    setLoading(true)
    const res = await fetch('/api/campanhas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: values.titulo,
        mensagem,
        tipo,
        rifa_id: rifaId || null,
        status: 'rascunho',
        agendado_para: values.agendado_para || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setLoading(false); return }
    toast.success('Campanha criada!')
    onSuccess(data)
    reset()
    setMensagem('')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border rounded-lg p-4 bg-gray-50 max-w-2xl">
      <h3 className="font-semibold flex items-center gap-2"><Megaphone className="h-4 w-4 text-blue-500" />Nova Campanha</h3>

      <Input placeholder="Título da campanha *" {...register('titulo', { required: true })} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger><SelectValue placeholder="Público-alvo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os cadastrados</SelectItem>
            <SelectItem value="compradores">Compradores (pago)</SelectItem>
            <SelectItem value="nao_compradores">Não compradores</SelectItem>
            <SelectItem value="reservados">Reservados (aguardando)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={rifaId} onValueChange={setRifaId}>
          <SelectTrigger><SelectValue placeholder="Rifa (opcional)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as rifas</SelectItem>
            {rifas.map((r) => <SelectItem key={r.id} value={r.id}>{r.titulo}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Mensagem *</Label>
        <div className="flex flex-wrap gap-1 mb-1">
          {VARIAVEIS.map((v) => (
            <button key={v} type="button" onClick={() => insertVar(v)}
              className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-200">
              {v}
            </button>
          ))}
        </div>
        <Textarea
          rows={5}
          placeholder="Digite a mensagem… Use as variáveis acima para personalizar."
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
        />
        {mensagem && (
          <div className="rounded-lg border bg-white p-3 text-sm whitespace-pre-wrap">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Preview:</p>
            {mensagem
              .replace(/{{nome}}/g, 'João Silva')
              .replace(/{{numeros}}/g, '42, 137')
              .replace(/{{rifa}}/g, rifas.find((r) => r.id === rifaId)?.titulo || 'Rifa ECC')
              .replace(/{{data_sorteio}}/g, '15/06/2025')}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label>Agendar envio (opcional)</Label>
        <Input type="datetime-local" {...register('agendado_para')} />
      </div>

      <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Criar campanha
      </Button>
    </form>
  )
}
