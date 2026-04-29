import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { RealtimeTickets } from '@/components/admin/RealtimeTickets'
import { SalesChart } from '@/components/admin/SalesChart'
import { TrendingUp, Ticket, DollarSign, Target } from 'lucide-react'

export const revalidate = 0

export default async function AdminDashboard() {
  const supabase = createClient()

  // Rifa ativa para KPIs
  const { data: rifa } = await supabase
    .from('rifas')
    .select('id, titulo, total_bilhetes, preco_bilhete, meta_arrecadacao')
    .eq('status', 'ativa')
    .order('criado_em', { ascending: false })
    .limit(1)
    .single()

  let totalArrecadado = 0
  let bilhetesVendidos = 0
  let bilhetesReservados = 0
  let salesData: { data: string; vendas: number }[] = []

  if (rifa) {
    // Bilhetes pagos
    const { count: pagos } = await supabase
      .from('bilhetes')
      .select('*', { count: 'exact', head: true })
      .eq('rifa_id', rifa.id)
      .eq('status', 'pago')

    const { count: reservados } = await supabase
      .from('bilhetes')
      .select('*', { count: 'exact', head: true })
      .eq('rifa_id', rifa.id)
      .eq('status', 'reservado')

    bilhetesVendidos = pagos || 0
    bilhetesReservados = reservados || 0
    totalArrecadado = bilhetesVendidos * rifa.preco_bilhete

    // Dados para gráfico: vendas por dia (últimos 14 dias)
    const { data: vendas } = await supabase
      .from('bilhetes')
      .select('pago_em')
      .eq('rifa_id', rifa.id)
      .eq('status', 'pago')
      .not('pago_em', 'is', null)
      .gte('pago_em', new Date(Date.now() - 14 * 86400000).toISOString())

    const mapaVendas = new Map<string, number>()
    vendas?.forEach((b) => {
      const dia = new Date(b.pago_em!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      mapaVendas.set(dia, (mapaVendas.get(dia) || 0) + 1)
    })
    salesData = Array.from(mapaVendas.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([data, vendas]) => ({ data, vendas }))
  }

  const meta = rifa?.meta_arrecadacao || 0
  const percentMeta = meta > 0 ? Math.min(100, Math.round((totalArrecadado / meta) * 100)) : 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {rifa && <p className="text-muted-foreground text-sm -mt-4">Rifa ativa: <strong>{rifa.titulo}</strong></p>}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Arrecadado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalArrecadado)}</p>
            {meta > 0 && <p className="text-xs text-muted-foreground mt-1">Meta: {formatCurrency(meta)}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bilhetes Pagos</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bilhetesVendidos}</p>
            <p className="text-xs text-muted-foreground mt-1">de {rifa?.total_bilhetes || 0} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reservados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{bilhetesReservados}</p>
            <p className="text-xs text-muted-foreground mt-1">aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meta Atingida</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{percentMeta}%</p>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${percentMeta}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendas por dia (últimos 14 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={salesData} />
          </CardContent>
        </Card>

        {/* Feed realtime */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <RealtimeTickets rifaId={rifa?.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
