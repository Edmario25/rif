import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { RealtimeTickets } from '@/components/admin/RealtimeTickets'
import { SalesChart } from '@/components/admin/SalesChart'
import { TrendingUp, Ticket, DollarSign, Target, Users, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0

export default async function AdminDashboard() {
  const supabase = createClient()

  // Todas as rifas ativas
  const { data: rifasAtivas } = await supabase
    .from('rifas')
    .select('id, titulo, total_bilhetes, preco_bilhete, meta_arrecadacao, data_sorteio, status')
    .eq('status', 'ativa')
    .order('criado_em', { ascending: false })

  // Rifa principal (mais recente) para KPIs e gráfico
  const rifa = rifasAtivas?.[0] ?? null

  // KPIs globais (todas as rifas ativas)
  let totalArrecadadoGeral = 0
  let totalPagosGeral = 0
  let totalReservadosGeral = 0
  let totalParticipantes = 0

  const rifaStats: Record<string, { pagos: number; reservados: number; arrecadado: number }> = {}

  if (rifasAtivas && rifasAtivas.length > 0) {
    for (const r of rifasAtivas) {
      const { count: pagos } = await supabase
        .from('bilhetes').select('*', { count: 'exact', head: true })
        .eq('rifa_id', r.id).eq('status', 'pago')
      const { count: reservados } = await supabase
        .from('bilhetes').select('*', { count: 'exact', head: true })
        .eq('rifa_id', r.id).eq('status', 'reservado')
      const p = pagos || 0
      const rv = reservados || 0
      rifaStats[r.id] = { pagos: p, reservados: rv, arrecadado: p * r.preco_bilhete }
      totalArrecadadoGeral += p * r.preco_bilhete
      totalPagosGeral += p
      totalReservadosGeral += rv
    }
  }

  // Total de participantes únicos
  const { count: countParticipantes } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'cliente')
  totalParticipantes = countParticipantes || 0

  // Gráfico: vendas por dia do rifa principal (últimos 14 dias)
  let salesData: { data: string; vendas: number }[] = []
  if (rifa) {
    const { data: vendas } = await supabase
      .from('bilhetes').select('pago_em')
      .eq('rifa_id', rifa.id).eq('status', 'pago')
      .not('pago_em', 'is', null)
      .gte('pago_em', new Date(Date.now() - 14 * 86400000).toISOString())
    const mapa = new Map<string, number>()
    vendas?.forEach((b) => {
      const dia = new Date(b.pago_em!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      mapa.set(dia, (mapa.get(dia) || 0) + 1)
    })
    salesData = Array.from(mapa.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([data, vendas]) => ({ data, vendas }))
  }

  const meta = rifa?.meta_arrecadacao || 0
  const arrecadadoPrincipal = rifa ? (rifaStats[rifa.id]?.arrecadado || 0) : 0
  const percentMeta = meta > 0 ? Math.min(100, Math.round((arrecadadoPrincipal / meta) * 100)) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visão geral do sistema</p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/admin/rifas/nova"><Plus className="h-4 w-4 mr-2" />Nova Rifa</Link>
        </Button>
      </div>

      {/* KPIs globais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500">Total Arrecadado</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalArrecadadoGeral)}</p>
            <p className="text-xs text-slate-400 mt-1">em rifas ativas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500">Bilhetes Pagos</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <Ticket className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{totalPagosGeral}</p>
            <p className="text-xs text-slate-400 mt-1">{totalReservadosGeral} reservados</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500">Participantes</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{totalParticipantes}</p>
            <p className="text-xs text-slate-400 mt-1">usuários cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500">Meta (rifa atual)</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                <Target className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{percentMeta}%</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
              <div className="h-1.5 rounded-full bg-green-500 transition-all" style={{ width: `${percentMeta}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rifas ativas */}
      {rifasAtivas && rifasAtivas.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-800">Rifas Ativas</CardTitle>
              <Link href="/admin/rifas" className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {rifasAtivas.map((r) => {
                const stats = rifaStats[r.id] || { pagos: 0, reservados: 0, arrecadado: 0 }
                const pct = Math.round((stats.pagos / r.total_bilhetes) * 100)
                return (
                  <div key={r.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 shrink-0">
                      <Ticket className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.titulo}</p>
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">Ativa</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 shrink-0">{stats.pagos}/{r.total_bilhetes}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-800">{formatCurrency(stats.arrecadado)}</p>
                      {r.data_sorteio && (
                        <p className="text-xs text-slate-400">{formatDate(r.data_sorteio)}</p>
                      )}
                    </div>
                    <Link href={`/admin/rifas/${r.id}`}
                      className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">
              Vendas por dia <span className="text-slate-400 font-normal text-xs ml-1">(últimos 14 dias)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={salesData} />
          </CardContent>
        </Card>

        {/* Feed realtime */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">Últimas atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <RealtimeTickets rifaId={rifa?.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
