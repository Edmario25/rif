import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Star, Ticket, Trophy } from 'lucide-react'
import Link from 'next/link'

export default async function ClienteDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, whatsapp')
    .eq('id', user.id)
    .single()

  const { data: bilhetes } = await supabase
    .from('bilhetes')
    .select('id, numero, status, conta_premiada, rifa_id, rifas(titulo, preco_bilhete, data_sorteio)')
    .eq('cliente_id', user.id)
    .in('status', ['reservado', 'pago'])
    .order('criado_em', { ascending: false })

  const pagos = bilhetes?.filter((b) => b.status === 'pago') || []
  const reservados = bilhetes?.filter((b) => b.status === 'reservado') || []
  const contaPremiada = bilhetes?.some((b) => b.conta_premiada && b.status === 'pago')

  // Agrupar por rifa
  const rifasMap = new Map<string, { titulo: string; bilhetes: typeof bilhetes }>()
  bilhetes?.forEach((b) => {
    const rifa = b.rifas as any
    if (!rifasMap.has(b.rifa_id)) {
      rifasMap.set(b.rifa_id, { titulo: rifa?.titulo || 'Rifa', bilhetes: [] })
    }
    rifasMap.get(b.rifa_id)!.bilhetes!.push(b)
  })

  const totalPago = pagos.reduce((sum, b) => sum + ((b.rifas as any)?.preco_bilhete || 0), 0)

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Olá, {profile?.nome?.split(' ')[0] || 'bem-vindo'}! 🙏
          </h1>
          <p className="text-muted-foreground text-sm">Que Deus abençoe sua participação!</p>
        </div>
        {contaPremiada && (
          <Badge className="ml-auto bg-yellow-100 text-yellow-800 border-yellow-300">
            <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
            Conta Premiada!
          </Badge>
        )}
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bilhetes confirmados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{pagos.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aguardando confirmação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{reservados.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total investido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(totalPago)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rifas */}
      {rifasMap.size > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Minhas participações</h2>
          {Array.from(rifasMap.entries()).map(([rifaId, { titulo, bilhetes: bs }]) => (
            <Card key={rifaId}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {bs?.length} bilhete{(bs?.length || 0) > 1 ? 's' : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/cliente/meus-bilhetes?rifa=${rifaId}`}>
                    <Ticket className="h-4 w-4 mr-1" />
                    Ver bilhetes
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Ticket className="h-12 w-12 text-gray-300" />
            <p className="text-muted-foreground">Você ainda não tem bilhetes.</p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/">Ver rifa ativa</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
