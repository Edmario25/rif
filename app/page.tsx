import { createClient } from '@/lib/supabase/server'
import { TicketGrid } from '@/components/rifa/TicketGrid'
import { PrizeCard } from '@/components/rifa/PrizeCard'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CalendarDays, CheckCircle2, CreditCard, MessageCircle, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const revalidate = 0

export default async function HomePage() {
  const supabase = createClient()

  const { data: rifa } = await supabase
    .from('rifas')
    .select('*')
    .eq('status', 'ativa')
    .order('criado_em', { ascending: false })
    .limit(1)
    .single()

  const { data: premios } = rifa
    ? await supabase
        .from('premios')
        .select('*')
        .eq('rifa_id', rifa.id)
        .order('ordem')
    : { data: [] }

  const { data: ganhadores } = await supabase
    .from('ganhadores')
    .select('*, profiles(nome), premios(titulo), rifas(titulo)')
    .eq('publicar', true)
    .order('premiado_em', { ascending: false })
    .limit(5)

  if (!rifa) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <Trophy className="h-16 w-16 text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-700">Nenhuma rifa ativa no momento</h1>
        <p className="text-muted-foreground">Volte em breve para participar das próximas rifas!</p>
        <Button asChild variant="outline">
          <Link href="/login">Acessar minha conta</Link>
        </Button>
      </div>
    )
  }

  const diasRestantes = rifa.data_sorteio
    ? Math.max(0, Math.ceil((new Date(rifa.data_sorteio).getTime() - Date.now()) / 86400000))
    : null

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-green-600 to-green-800 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center space-y-4">
          {rifa.imagem_url && (
            <img
              src={rifa.imagem_url}
              alt={rifa.titulo}
              className="mx-auto mb-4 h-48 w-auto rounded-xl object-cover shadow-lg"
            />
          )}
          <h1 className="text-3xl font-bold sm:text-4xl">{rifa.titulo}</h1>
          {rifa.descricao && <p className="text-green-100 text-lg">{rifa.descricao}</p>}

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <div className="rounded-xl bg-white/10 px-6 py-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold">{formatCurrency(rifa.preco_bilhete)}</p>
              <p className="text-xs text-green-100">por bilhete</p>
            </div>
            {diasRestantes !== null && (
              <div className="rounded-xl bg-white/10 px-6 py-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold">{diasRestantes}</p>
                <p className="text-xs text-green-100">dias para o sorteio</p>
              </div>
            )}
            {rifa.data_sorteio && (
              <div className="rounded-xl bg-white/10 px-6 py-3 text-center backdrop-blur-sm">
                <p className="text-lg font-bold">{formatDate(rifa.data_sorteio)}</p>
                <p className="text-xs text-green-100">data do sorteio</p>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button asChild size="lg" className="bg-white text-green-700 hover:bg-green-50 font-bold">
              <Link href="/login">🎟️ Quero participar!</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Prêmios */}
      {premios && premios.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="mb-6 text-center text-2xl font-bold">🏆 Prêmios</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {premios.map((p: any) => <PrizeCard key={p.id} premio={p} />)}
          </div>
        </section>
      )}

      {/* Grade de bilhetes */}
      <section className="mx-auto max-w-4xl px-4 py-8">
        <h2 className="mb-6 text-center text-2xl font-bold">🎟️ Bilhetes</h2>
        <TicketGrid rifaId={rifa.id} />
        <div className="mt-6 text-center">
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
            <Link href="/login">Escolher meu bilhete</Link>
          </Button>
        </div>
      </section>

      {/* Como participar */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">Como participar</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: MessageCircle, title: '1. Faça login', desc: 'Entre com seu WhatsApp em segundos, sem senha.' },
              { icon: CreditCard, title: '2. Escolha seu bilhete', desc: 'Selecione seu número da sorte e pague via PIX.' },
              {
                icon: CheckCircle2,
                title: '3. Aguarde o sorteio',
                desc: rifa.data_sorteio
                  ? `Sorteio em ${formatDate(rifa.data_sorteio)} — ${rifa.metodo_sorteio?.replace('_', ' ')}.`
                  : 'Acompanhe o sorteio em breve!',
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <item.icon className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          {rifa.pix_chave && (
            <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <p className="font-medium text-green-800">Chave PIX: <strong>{rifa.pix_chave}</strong></p>
              {rifa.pix_nome && <p className="text-sm text-green-700">Titular: {rifa.pix_nome}</p>}
            </div>
          )}
        </div>
      </section>

      {/* Ganhadores */}
      {ganhadores && ganhadores.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="mb-6 text-center text-2xl font-bold">🎉 Contemplados</h2>
          <div className="space-y-3">
            {ganhadores.map((g: any) => (
              <div key={g.id} className="flex items-center gap-4 rounded-xl border bg-yellow-50 p-4">
                <Trophy className="h-8 w-8 shrink-0 text-yellow-500" />
                <div>
                  <p className="font-semibold">{g.profiles?.nome || 'Contemplado'}</p>
                  <p className="text-sm text-muted-foreground">
                    {g.premios?.titulo} — Bilhete #{g.numero_sorteado} — {g.rifas?.titulo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="bg-green-800 py-6 text-center text-sm text-green-200">
        <p>Rifa ECC — Paróquia 🙏</p>
      </footer>
    </main>
  )
}
