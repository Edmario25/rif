'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TicketCard } from './TicketCard'
import { Badge } from '@/components/ui/badge'

interface Bilhete {
  id: string
  numero: number
  status: 'disponivel' | 'reservado' | 'pago' | 'cancelado'
  conta_premiada: boolean
}

interface TicketGridProps {
  rifaId: string
  onSelect?: (bilhete: Bilhete) => void
}

export function TicketGrid({ rifaId, onSelect }: TicketGridProps) {
  const supabase = createClient()
  const [bilhetes, setBilhetes] = useState<Bilhete[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBilhetes() {
      const { data } = await supabase
        .from('bilhetes')
        .select('id, numero, status, conta_premiada')
        .eq('rifa_id', rifaId)
        .order('numero')
      setBilhetes(data || [])
      setLoading(false)
    }
    fetchBilhetes()

    // Realtime: atualiza grade ao vivo
    const channel = supabase
      .channel(`bilhetes-rifa-${rifaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bilhetes', filter: `rifa_id=eq.${rifaId}` },
        (payload) => {
          setBilhetes((prev) =>
            prev.map((b) =>
              b.id === (payload.new as Bilhete).id ? { ...b, ...(payload.new as Bilhete) } : b
            )
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [rifaId])

  const total = bilhetes.length
  const pagos = bilhetes.filter((b) => b.status === 'pago').length
  const reservados = bilhetes.filter((b) => b.status === 'reservado').length
  const disponiveis = bilhetes.filter((b) => b.status === 'disponivel').length

  if (loading) {
    return (
      <div className="grid grid-cols-10 gap-1 animate-pulse">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-gray-200" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legenda e stats */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline" className="border-gray-200 bg-white">⬜ {disponiveis} disponíveis</Badge>
        <Badge variant="outline" className="border-yellow-300 bg-yellow-100 text-yellow-800">🟡 {reservados} reservados</Badge>
        <Badge variant="outline" className="border-green-600 bg-green-500 text-white">🟢 {pagos} pagos</Badge>
        <Badge variant="outline" className="border-yellow-400 bg-white">⭐ conta premiada</Badge>
      </div>

      {/* Grade */}
      <div className="grid grid-cols-10 gap-1">
        {bilhetes.map((b) => (
          <TicketCard
            key={b.id}
            numero={b.numero}
            status={b.status}
            contaPremiada={b.conta_premiada}
            onClick={() => onSelect?.(b)}
          />
        ))}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{pagos + reservados}/{total} bilhetes vendidos/reservados</span>
          <span>{total > 0 ? Math.round(((pagos + reservados) / total) * 100) : 0}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-green-500 transition-all"
            style={{ width: `${total > 0 ? ((pagos + reservados) / total) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  )
}
