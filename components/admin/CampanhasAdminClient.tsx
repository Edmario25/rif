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

      {/* Histórico */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Histórico de campanhas</h2>
        </div>
        {campanhas.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
              <Send className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500">Nenhuma campanha criada ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {campanhas.map((c) => (
              <div key={c.id} className="flex flex-col gap-2 px-5 py-4 hover:bg-slate-50 transition-colors sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{c.titulo}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.tipo.replace('_', ' ')}
                    {c.rifas?.titulo ? ` · ${c.rifas.titulo}` : ''}
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
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium border-0 ${statusColor[c.status]}`}>
                    {c.status}
                  </span>
                  {c.status === 'rascunho' && (
                    <Button size="sm" onClick={() => disparar(c.id)} disabled={disparando === c.id}
                      className="bg-green-600 hover:bg-green-700 h-8">
                      {disparando === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      <span className="ml-1.5">Disparar</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
