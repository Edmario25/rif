'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Evento {
  id: string
  numero: number
  status: string
  profiles?: { nome: string; whatsapp: string }
  rifas?: { titulo: string }
  reservado_em: string | null
  pago_em: string | null
}

export function RealtimeTickets({ rifaId }: { rifaId?: string }) {
  const supabase = createClient()
  const [eventos, setEventos] = useState<Evento[]>([])

  useEffect(() => {
    // Carregar últimas 10 ações
    async function fetchRecentes() {
      const query = supabase
        .from('bilhetes')
        .select('id, numero, status, profiles(nome, whatsapp), rifas(titulo), reservado_em, pago_em')
        .in('status', ['reservado', 'pago'])
        .order('pago_em', { ascending: false, nullsFirst: false })
        .limit(10)

      if (rifaId) query.eq('rifa_id', rifaId)
      const { data } = await query
      setEventos((data as unknown as Evento[]) || [])
    }
    fetchRecentes()

    // Realtime
    const filter = rifaId ? `rifa_id=eq.${rifaId}` : undefined
    const channel = supabase
      .channel('admin-bilhetes-feed')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bilhetes', ...(filter ? { filter } : {}) },
        async (payload) => {
          const { data } = await supabase
            .from('bilhetes')
            .select('id, numero, status, profiles(nome, whatsapp), rifas(titulo), reservado_em, pago_em')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setEventos((prev) => [data as unknown as Evento, ...prev.filter((e) => e.id !== data.id)].slice(0, 10))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [rifaId])

  if (eventos.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma atividade recente.</p>
  }

  return (
    <div className="space-y-2">
      {eventos.map((e) => (
        <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
          <div>
            <span className="font-medium">{(e.profiles as any)?.nome || 'Cliente'}</span>
            <span className="text-muted-foreground ml-1">· Bilhete #{e.numero}</span>
            {(e.rifas as any)?.titulo && (
              <span className="text-muted-foreground"> · {(e.rifas as any).titulo}</span>
            )}
          </div>
          <Badge variant={e.status === 'pago' ? 'default' : 'outline'}
            className={e.status === 'pago' ? 'bg-green-600 text-xs' : 'text-yellow-700 border-yellow-400 text-xs'}>
            {e.status === 'pago' ? '✓ Pago' : '⏳ Reservado'}
          </Badge>
        </div>
      ))}
    </div>
  )
}
