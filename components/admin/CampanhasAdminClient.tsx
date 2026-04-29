'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CampanhaForm } from './CampanhaForm'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Campanha {
  id: string
  titulo: string
  tipo: string
  status: string
  total_enviados: number
  total_erros: number
  agendado_para: string | null
  enviado_em: string | null
  criado_em: string
  rifas: { titulo: string } | null
}

const statusColor: Record<string, string> = {
  rascunho:  'bg-gray-100 text-gray-700',
  agendada:  'bg-blue-100 text-blue-700',
  enviando:  'bg-yellow-100 text-yellow-800 animate-pulse',
  concluida: 'bg-green-100 text-green-700',
  erro:      'bg-red-100 text-red-700',
}

export function CampanhasAdminClient({ rifas, initialCampanhas }: { rifas: any[]; initialCampanhas: Campanha[] }) {
  const supabase = createClient()
  const [campanhas, setCampanhas] = useState<Campanha[]>(initialCampanhas)
  const [disparando, setDisparando] = useState<string | null>(null)

  // Realtime: atualizar status da campanha durante envio
  useEffect(() => {
    const channel = supabase
      .channel('campanhas-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'campanhas' }, (payload) => {
        setCampanhas((prev) => prev.map((c) => c.id === payload.new.id ? { ...c, ...(payload.new as Campanha) } : c))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function onSuccess(nova: Campanha) {
    setCampanhas((prev) => [nova, ...prev])
  }

  async function disparar(id: string) {
    setDisparando(id)
    const res = await fetch('/api/campanhas/disparar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campanha_id: id }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Campanha disparada! Acompanhe o status em tempo real.')
      setCampanhas((prev) => prev.map((c) => c.id === id ? { ...c, status: 'enviando' } : c))
    } else {
      toast.error(data.error)
    }
    setDisparando(null)
  }

  return (
    <div className="space-y-6">
      <CampanhaForm rifas={rifas} onSuccess={onSuccess} />

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Histórico de campanhas</h2>
        {campanhas.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma campanha criada.</p>}
        {campanhas.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{c.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {c.tipo.replace('_', ' ')} {c.rifas?.titulo ? `· ${c.rifas.titulo}` : ''}
                  {c.agendado_para ? ` · Agendada: ${formatDate(c.agendado_para)}` : ''}
                </p>
                {c.status === 'concluida' && (
                  <p className="text-xs text-green-600 mt-1">✓ {c.total_enviados} enviados · {c.total_erros} erros</p>
                )}
                {c.status === 'enviando' && (
                  <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Enviando… {c.total_enviados} enviados
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[c.status]}`}>
                  {c.status}
                </span>
                {c.status === 'rascunho' && (
                  <Button size="sm" onClick={() => disparar(c.id)} disabled={disparando === c.id}
                    className="bg-green-600 hover:bg-green-700">
                    {disparando === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="ml-1">Disparar</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
