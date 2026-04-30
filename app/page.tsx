import { createClient } from '@/lib/supabase/server'
import { TicketSelector } from '@/components/rifa/TicketSelector'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  CalendarDays, Trophy, Users, Ticket,
  CheckCircle2, CreditCard, MessageCircle,
  ChevronRight, Gift, Star, Lock
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

  // Contas premiadas — lista de prêmios surpresa
  const { data: contasPremiadas } = rifa
    ? await supabase
        .from('contas_premiadas')
        .select('*, premios(titulo, descricao, imagem_url)')
        .eq('rifa_id', rifa.id)
        .eq('ativo', true)
        .order('numero_bilhete')
    : { data: [] }

  // Bilhetes das contas premiadas que já foram comprados (para mostrar os ganhadores)
  const numerosPremiados = contasPremiadas?.map((c: any) => c.numero_bilhete) || []
  const { data: bilhetesPremiados } = rifa && numerosPremiados.length > 0
    ? await supabase
        .from('bilhetes')
        .select('numero, status, profiles(nome, whatsapp)')
        .eq('rifa_id', rifa.id)
        .in('numero', numerosPremiados)
        .eq('status', 'pago')
    : { data: [] }

  const ganhadorPorNumero: Record<number, any> = {}
  bilhetesPremiados?.forEach((b: any) => {
    ganhadorPorNumero[b.numero] = b.profiles
  })

  const { data: ganhadores } = await supabase
    .from('ganhadores')
    .select('*, profiles(nome), premios(titulo), rifas(titulo)')
    .eq('publicar', true)
    .order('premiado_em', { ascending: false })
    .limit(5)

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

  const totalContasDisp = contasPremiadas?.filter((c: any) => !ganhadorPorNumero[c.numero_bilhete]).length || 0
  const totalContasGanhas = contasPremiadas?.filter((c: any) => !!ganhadorPorNumero[c.numero_bilhete]).length || 0

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
              {contasPremiadas && contasPremiadas.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-yellow-400/20 border border-yellow-400/30 px-4 py-2.5 backdrop-blur-sm">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-300">{totalContasDisp} prêmios surpresa disponíveis</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Conteúdo principal ── */}
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">

        <div className="grid gap-8 lg:grid-cols-5">

          {/* Coluna esquerda — Seletor */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Escolha seus bilhetes</h2>
              <p className="text-sm text-slate-500 mb-5">Selecione a quantidade e garanta sua participação</p>
              <TicketSelector preco={rifa.preco_bilhete} disponiveis={rifa.total_bilhetes} rifaId={rifa.id} />
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
          </div>
        </div>

        {/* ── Contas Premiadas ── */}
        {contasPremiadas && contasPremiadas.length > 0 && (
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            {/* Cabeçalho */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white">Prêmios Surpresa</h2>
                    <p className="text-xs text-yellow-100">Bilhetes especiais com premiação instantânea!</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">{contasPremiadas.length}</p>
                  <p className="text-xs text-yellow-100">premiações</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Alerta de surpresa */}
              <div className="mb-5 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 flex items-start gap-3">
                <Lock className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Prêmio surpresa!</span> Ao comprar seu bilhete, você pode ser contemplado instantaneamente — sem esperar o sorteio. Os números premiados são revelados apenas no momento da compra.
                </p>
              </div>

              {/* Grid de contas */}
              <div className="grid gap-3 sm:grid-cols-2">
                {contasPremiadas.map((conta: any) => {
                  const ganhador = ganhadorPorNumero[conta.numero_bilhete]
                  return (
                    <div
                      key={conta.id}
                      className={[
                        'relative rounded-xl border-2 p-4 transition-all',
                        ganhador
                          ? 'border-green-200 bg-green-50'
                          : 'border-yellow-200 bg-yellow-50',
                      ].join(' ')}
                    >
                      {/* Badge status */}
                      <div className={[
                        'absolute -top-2.5 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide shadow-sm',
                        ganhador
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-400 text-yellow-900',
                      ].join(' ')}>
                        {ganhador ? '🎉 Ganho!' : '✨ Disponível'}
                      </div>

                      <div className="flex items-start gap-3">
                        <div className={[
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-sm',
                          ganhador ? 'bg-green-200 text-green-700' : 'bg-yellow-200 text-yellow-700',
                        ].join(' ')}>
                          <Star className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm leading-tight">
                            {conta.descricao_premio}
                          </p>
                          {conta.premios?.titulo && conta.premios.titulo !== conta.descricao_premio && (
                            <p className="text-xs text-slate-500 mt-0.5">{conta.premios.titulo}</p>
                          )}
                          {ganhador ? (
                            <div className="mt-2 flex items-center gap-1.5">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-[9px] font-bold">
                                ✓
                              </div>
                              <p className="text-xs font-semibold text-green-700">
                                {ganhador.nome
                                  ? `${ganhador.nome.split(' ')[0]} já ganhou!`
                                  : 'Já foi ganho!'}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-yellow-700 mt-1.5 font-medium">
                              Pode ser o seu próximo bilhete! 🍀
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Resumo */}
              {(totalContasDisp > 0 || totalContasGanhas > 0) && (
                <div className="mt-4 flex items-center justify-center gap-6 rounded-xl bg-slate-50 border border-slate-100 py-3">
                  <div className="text-center">
                    <p className="text-lg font-black text-yellow-500">{totalContasDisp}</p>
                    <p className="text-xs text-slate-500">disponíveis</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-center">
                    <p className="text-lg font-black text-green-500">{totalContasGanhas}</p>
                    <p className="text-xs text-slate-500">já ganhos</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-center">
                    <p className="text-lg font-black text-slate-700">{contasPremiadas.length}</p>
                    <p className="text-xs text-slate-500">total</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
                desc: 'Selecione a quantidade de bilhetes e pague na hora.',
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

        {/* ── Ganhadores do sorteio ── */}
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
