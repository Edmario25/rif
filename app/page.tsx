import { createClient } from '@/lib/supabase/server'
import { TicketGrid } from '@/components/rifa/TicketGrid'
import { TicketSelector } from '@/components/rifa/TicketSelector'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  CalendarDays, Trophy, Users, Ticket,
  CheckCircle2, CreditCard, MessageCircle,
  ChevronRight, Lock
} from 'lucide-react'
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
    ? await supabase.from('premios').select('*').eq('rifa_id', rifa.id).order('ordem')
    : { data: [] }

  const { data: ganhadores } = await supabase
    .from('ganhadores')
    .select('*, profiles(nome), premios(titulo), rifas(titulo)')
    .eq('publicar', true)
    .order('premiado_em', { ascending: false })
    .limit(5)

  // Stats de bilhetes
  let totalBilhetes = 0, pagos = 0, reservados = 0
  if (rifa) {
    const { data: stats } = await supabase
      .from('bilhetes')
      .select('status')
      .eq('rifa_id', rifa.id)
    totalBilhetes = stats?.length || 0
    pagos = stats?.filter((b) => b.status === 'pago').length || 0
    reservados = stats?.filter((b) => b.status === 'reservado').length || 0
  }
  const vendidos = pagos + reservados
  const pct = totalBilhetes > 0 ? Math.round((vendidos / totalBilhetes) * 100) : 0
  const disponiveis = totalBilhetes - vendidos

  if (!rifa) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center bg-slate-50">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <Ticket className="h-10 w-10 text-slate-300" />
        </div>
        <h1 className="text-2xl font-bold text-slate-700">Nenhuma rifa ativa no momento</h1>
        <p className="text-slate-400">Volte em breve para participar das próximas rifas!</p>
        <Link href="/login"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
          Acessar minha conta
        </Link>
      </div>
    )
  }

  const diasRestantes = rifa.data_sorteio
    ? Math.max(0, Math.ceil((new Date(rifa.data_sorteio).getTime() - Date.now()) / 86400000))
    : null

  const premio1 = premios?.find((p: any) => p.ordem === 1)
  const outrosPremios = premios?.filter((p: any) => p.ordem !== 1) || []

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
              <Ticket className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">Rifa ECC</span>
          </div>
          <Link href="/login"
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors">
            <Ticket className="h-3.5 w-3.5" />
            Ver meus bilhetes
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-slate-900">
        {rifa.imagem_url ? (
          <img
            src={rifa.imagem_url}
            alt={rifa.titulo}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-emerald-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <div className="max-w-2xl space-y-4">
            {/* Badge data */}
            {rifa.data_sorteio && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <CalendarDays className="h-3.5 w-3.5 text-green-400" />
                Sorteio: {formatDate(rifa.data_sorteio)}
                {diasRestantes !== null && (
                  <span className="ml-1 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold">
                    {diasRestantes}d
                  </span>
                )}
              </div>
            )}

            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              {rifa.titulo}
            </h1>

            {rifa.descricao && (
              <p className="text-base text-slate-300 leading-relaxed max-w-xl">{rifa.descricao}</p>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                <span className="text-2xl font-black text-green-400">{formatCurrency(rifa.preco_bilhete)}</span>
                <span className="text-xs text-slate-300">por bilhete</span>
              </div>
              {diasRestantes !== null && (
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                  <span className="text-2xl font-black text-white">{diasRestantes}</span>
                  <span className="text-xs text-slate-300">dias restantes</span>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                <span className="text-2xl font-black text-white">{totalBilhetes.toLocaleString('pt-BR')}</span>
                <span className="text-xs text-slate-300">bilhetes totais</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Barra de progresso ── */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold text-slate-700">{vendidos.toLocaleString('pt-BR')} bilhetes vendidos</span>
            <span className="font-bold text-green-600">{pct}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all shadow-sm"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>{pagos.toLocaleString('pt-BR')} pagos · {reservados.toLocaleString('pt-BR')} reservados</span>
            <span>{disponiveis.toLocaleString('pt-BR')} disponíveis</span>
          </div>
        </div>
      </div>

      {/* ── Conteúdo principal ── */}
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">

        <div className="grid gap-8 lg:grid-cols-5">

          {/* Coluna esquerda — Seletor */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Escolha seus bilhetes</h2>
              <p className="text-sm text-slate-500 mb-5">Selecione a quantidade e garanta sua participação</p>
              <TicketSelector preco={rifa.preco_bilhete} disponiveis={disponiveis} rifaId={rifa.id} />
            </div>
          </div>

          {/* Coluna direita — Prêmios */}
          <div className="lg:col-span-2 space-y-4">
            {/* Prêmio principal */}
            {premio1 && (
              <div className="rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 p-5 shadow-md text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wide opacity-90">1º Prêmio</span>
                </div>
                <h3 className="text-xl font-extrabold leading-tight">{premio1.titulo}</h3>
                {premio1.descricao && (
                  <p className="text-sm opacity-80 mt-1">{premio1.descricao}</p>
                )}
              </div>
            )}

            {/* Outros prêmios */}
            {outrosPremios.length > 0 && (
              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 space-y-3">
                {outrosPremios.map((p: any, i: number) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className={[
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black',
                      i === 0 ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-500'
                    ].join(' ')}>
                      {i + 2}º
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{p.titulo}</p>
                      {p.descricao && <p className="text-xs text-slate-400">{p.descricao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PIX info */}
            {rifa.pix_chave && (
              <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Pagamento via PIX</span>
                </div>
                <p className="text-sm font-mono text-blue-800 break-all">{rifa.pix_chave}</p>
                {rifa.pix_nome && <p className="text-xs text-blue-600 mt-0.5">Titular: {rifa.pix_nome}</p>}
              </div>
            )}
          </div>
        </div>

        {/* ── Grade de bilhetes ── */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Todos os bilhetes</h2>
              <p className="text-sm text-slate-500 mt-0.5">Atualizado em tempo real</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-white border border-slate-300" /> Disponível
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-yellow-50 border border-yellow-200 px-2.5 py-1 text-yellow-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-yellow-300" /> Reservado
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-green-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-green-500" /> Pago
              </span>
            </div>
          </div>
          <TicketGrid rifaId={rifa.id} />
          <div className="mt-5 text-center">
            <Link href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-green-100 hover:bg-green-700 transition-all">
              🎟️ Escolher meu bilhete
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* ── Como participar ── */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 text-center">Como participar</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: MessageCircle,
                color: 'bg-green-100 text-green-600',
                step: '1',
                title: 'Entre com WhatsApp',
                desc: 'Login instantâneo pelo número do celular, sem senha.',
              },
              {
                icon: CreditCard,
                color: 'bg-blue-100 text-blue-600',
                step: '2',
                title: 'Escolha e pague via PIX',
                desc: 'Selecione seus números da sorte e pague na hora.',
              },
              {
                icon: Trophy,
                color: 'bg-yellow-100 text-yellow-600',
                step: '3',
                title: 'Aguarde o sorteio',
                desc: rifa.data_sorteio
                  ? `Sorteio em ${formatDate(rifa.data_sorteio)}.`
                  : 'Acompanhe o resultado em breve!',
              },
            ].map(({ icon: Icon, color, step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Ganhadores anteriores ── */}
        {ganhadores && ganhadores.length > 0 && (
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">🎉 Contemplados</h2>
            <div className="space-y-3">
              {ganhadores.map((g: any) => (
                <div key={g.id} className="flex items-center gap-4 rounded-xl bg-yellow-50 border border-yellow-100 p-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-200">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{g.profiles?.nome || 'Contemplado'}</p>
                    <p className="text-xs text-slate-500">
                      {g.premios?.titulo && `${g.premios.titulo} · `}
                      Bilhete #{g.numero_sorteado}
                      {g.rifas?.titulo && ` · ${g.rifas.titulo}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ── Rodapé ── */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
                <Ticket className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-slate-700">Rifa ECC</span>
              <span className="text-slate-300">·</span>
              <span className="text-sm text-slate-500">Paróquia ECC</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Pagamento seguro via PIX
              <span className="mx-1">·</span>
              <Users className="h-4 w-4" />
              Somente maiores de 18 anos
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center sm:text-left">
            © {new Date().getFullYear()} Rifa ECC — Paróquia ECC. Todos os direitos reservados.
            Este site é destinado exclusivamente para maiores de 18 anos.
          </p>
        </div>
      </footer>

    </div>
  )
}
