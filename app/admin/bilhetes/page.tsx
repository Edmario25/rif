'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Star, CheckCircle2, X, Eye } from 'lucide-react'

interface Bilhete {
  id: string
  numero: number
  status: string
  conta_premiada: boolean
  reservado_em: string | null
  pago_em: string | null
  comprovante_url: string | null
  profiles: { nome: string; whatsapp: string } | null
  rifas: { titulo: string } | null
  rifa_id: string
}

interface Rifa { id: string; titulo: string }

export default function BilhetesAdminPage() {
  const supabase = createClient()
  const [bilhetes, setBilhetes] = useState<Bilhete[]>([])
  const [rifas, setRifas] = useState<Rifa[]>([])
  const [rifaFiltro, setRifaFiltro] = useState('todas')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [selected, setSelected] = useState<Bilhete | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: rifasData } = await supabase.from('rifas').select('id, titulo').order('criado_em', { ascending: false })
      setRifas(rifasData || [])

      const { data } = await supabase
        .from('bilhetes')
        .select('id, numero, status, conta_premiada, reservado_em, pago_em, comprovante_url, rifa_id, profiles(nome, whatsapp), rifas(titulo)')
        .in('status', ['reservado', 'pago'])
        .order('reservado_em', { ascending: false })
        .limit(200)
      setBilhetes((data as unknown as Bilhete[]) || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  async function confirmarPagamento(bilheteId: string) {
    setConfirmando(true)
    const res = await fetch('/api/bilhetes/confirmar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bilhete_id: bilheteId }),
    })
    const data = await res.json()
    if (res.ok) {
      setBilhetes((prev) => prev.map((b) => b.id === bilheteId ? { ...b, status: 'pago', pago_em: new Date().toISOString() } : b))
      setSelected((s) => s ? { ...s, status: 'pago' } : null)
      toast.success('Pagamento confirmado! Notificação enviada via WhatsApp.')
    } else {
      toast.error(data.error)
    }
    setConfirmando(false)
  }

  async function cancelarBilhete(bilheteId: string) {
    const res = await fetch('/api/bilhetes/cancelar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bilhete_id: bilheteId }),
    })
    if (res.ok) {
      setBilhetes((prev) => prev.filter((b) => b.id !== bilheteId))
      setSelected(null)
      toast.success('Bilhete cancelado.')
    } else {
      toast.error('Erro ao cancelar.')
    }
  }

  const filtered = bilhetes.filter((b) => {
    if (rifaFiltro !== 'todas' && b.rifa_id !== rifaFiltro) return false
    if (statusFiltro !== 'todos' && b.status !== statusFiltro) return false
    if (busca) {
      const q = busca.toLowerCase()
      return (
        String(b.numero).includes(q) ||
        b.profiles?.nome?.toLowerCase().includes(q) ||
        b.profiles?.whatsapp?.includes(q)
      )
    }
    return true
  })

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando bilhetes…</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestão de Bilhetes</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={rifaFiltro} onValueChange={setRifaFiltro}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Rifa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as rifas</SelectItem>
            {rifas.map((r) => <SelectItem key={r.id} value={r.id}>{r.titulo}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="reservado">Reservados</SelectItem>
            <SelectItem value="pago">Pagos</SelectItem>
          </SelectContent>
        </Select>
        <Input className="w-56" placeholder="Buscar por nome ou número…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <span className="self-center text-sm text-muted-foreground">{filtered.length} bilhetes</span>
      </div>

      {/* Grade */}
      <div className="grid grid-cols-10 gap-1 max-h-[60vh] overflow-y-auto border rounded-lg p-3 bg-white">
        {filtered.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelected(b)}
            className={cn(
              'relative flex h-10 w-full items-center justify-center rounded border text-xs font-medium transition-colors',
              b.status === 'pago' ? 'bg-green-500 border-green-600 text-white hover:bg-green-600'
                : 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200'
            )}
          >
            {b.conta_premiada && <Star className="absolute top-0.5 right-0.5 h-2 w-2 fill-yellow-400 text-yellow-400" />}
            {b.numero}
          </button>
        ))}
        {filtered.length === 0 && <p className="col-span-10 text-center py-8 text-muted-foreground">Nenhum bilhete encontrado.</p>}
      </div>

      {/* Modal detalhes */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bilhete #{selected?.numero}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-1 text-sm">
                <p><strong>Rifa:</strong> {selected.rifas?.titulo}</p>
                <p><strong>Cliente:</strong> {selected.profiles?.nome || '—'}</p>
                <p><strong>WhatsApp:</strong> {selected.profiles?.whatsapp || '—'}</p>
                <p><strong>Status:</strong>{' '}
                  <Badge className={selected.status === 'pago' ? 'bg-green-600' : 'border-yellow-400 text-yellow-700'} variant={selected.status === 'pago' ? 'default' : 'outline'}>
                    {selected.status}
                  </Badge>
                </p>
                {selected.reservado_em && <p><strong>Reservado em:</strong> {formatDate(selected.reservado_em)}</p>}
                {selected.pago_em && <p><strong>Pago em:</strong> {formatDate(selected.pago_em)}</p>}
                {selected.conta_premiada && <p className="text-yellow-600 font-semibold">⭐ Este é um bilhete com CONTA PREMIADA!</p>}
              </div>

              {selected.comprovante_url && (
                <div>
                  <p className="text-sm font-medium mb-1">Comprovante:</p>
                  <a href={selected.comprovante_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 underline">
                    <Eye className="h-4 w-4" /> Ver comprovante
                  </a>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {selected.status === 'reservado' && (
                  <Button onClick={() => confirmarPagamento(selected.id)} disabled={confirmando}
                    className="bg-green-600 hover:bg-green-700 flex-1">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {confirmando ? 'Confirmando…' : 'Confirmar Pagamento'}
                  </Button>
                )}
                {selected.status !== 'pago' && (
                  <Button variant="destructive" onClick={() => cancelarBilhete(selected.id)}>
                    <X className="h-4 w-4 mr-2" /> Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
