'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Clock, Copy, Loader2, QrCode, XCircle, Ticket, ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface Pagamento {
  id: string
  status: string
  numeros: number[]
  valor: number
  expira_em: string
}

export default function PagarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [pagamento, setPagamento] = useState<Pagamento | null>(null)
  const [qrBase64, setQrBase64] = useState('')
  const [pixCopiaECola, setPixCopiaECola] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  // Carregar dados do pagamento
  useEffect(() => {
    if (!id) { setErro('ID de pagamento inválido.'); setLoading(false); return }

    async function load() {
      // Buscar status
      const res = await fetch(`/api/pagamento/status?id=${id}`)
      if (!res.ok) { setErro('Pagamento não encontrado.'); setLoading(false); return }
      const data = await res.json()
      setPagamento(data)

      // Buscar QR code do localStorage (salvo pelo TicketSelector)
      const stored = sessionStorage.getItem(`pix_${id}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        setQrBase64(parsed.qr_code_base64 || '')
        setPixCopiaECola(parsed.qr_code || '')
      }

      // Timer
      const expira = new Date(data.expira_em).getTime()
      const diff = Math.max(0, Math.floor((expira - Date.now()) / 1000))
      setSegundos(diff)
      setLoading(false)
    }
    load()
  }, [id])

  // Countdown
  useEffect(() => {
    if (segundos <= 0) return
    const t = setInterval(() => setSegundos((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [segundos])

  // Polling de status a cada 5s
  const checkStatus = useCallback(async () => {
    if (!id || !pagamento) return
    if (['aprovado', 'cancelado', 'expirado'].includes(pagamento.status)) return

    const res = await fetch(`/api/pagamento/status?id=${id}`)
    if (!res.ok) return
    const data = await res.json()
    setPagamento(data)

    if (data.status === 'aprovado') {
      router.push(`/cliente/pagar/sucesso?id=${id}`)
    }
  }, [id, pagamento, router])

  useEffect(() => {
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [checkStatus])

  function copiar() {
    if (!pixCopiaECola) return
    navigator.clipboard.writeText(pixCopiaECola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  const mm = String(Math.floor(segundos / 60)).padStart(2, '0')
  const ss = String(segundos % 60).padStart(2, '0')
  const urgente = segundos > 0 && segundos < 120

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (erro) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-8 text-center">
        <XCircle className="h-16 w-16 text-red-400" />
        <p className="text-lg font-semibold text-slate-700">{erro}</p>
        <Link href="/" className="text-sm text-green-600 underline">Voltar ao início</Link>
      </div>
    )
  }

  if (pagamento?.status === 'aprovado') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Pagamento confirmado!</h1>
        <p className="text-slate-500">Seus bilhetes foram reservados com sucesso.</p>
        <Link href="/cliente/meus-bilhetes"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700">
          <Ticket className="h-4 w-4" /> Ver meus bilhetes
        </Link>
      </div>
    )
  }

  if (pagamento?.status === 'cancelado' || segundos === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-10 w-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-700">Pagamento expirado</h1>
        <p className="text-slate-500">Os bilhetes foram liberados. Tente novamente.</p>
        <Link href="/"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-700">
          Tentar novamente
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">

      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600">
              <Ticket className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-sm">Rifa ECC</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-8 space-y-5">

        {/* Timer */}
        <div className={[
          'flex items-center justify-between rounded-2xl px-5 py-4 border',
          urgente
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-slate-100 shadow-sm'
        ].join(' ')}>
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${urgente ? 'text-red-500' : 'text-slate-400'}`} />
            <span className={`text-sm font-medium ${urgente ? 'text-red-700' : 'text-slate-600'}`}>
              {urgente ? 'Expirando!' : 'Expira em'}
            </span>
          </div>
          <span className={`text-2xl font-black tabular-nums ${urgente ? 'text-red-600' : 'text-slate-800'}`}>
            {mm}:{ss}
          </span>
        </div>

        {/* Card principal */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">

          {/* Topo */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 text-white text-center">
            <p className="text-sm font-medium opacity-80 mb-1">Total a pagar</p>
            <p className="text-4xl font-black">{formatCurrency(pagamento?.valor || 0)}</p>
            <p className="text-sm opacity-70 mt-1">
              {pagamento?.numeros.length} bilhete{(pagamento?.numeros.length || 0) > 1 ? 's' : ''}:{' '}
              {pagamento?.numeros.slice(0, 5).join(', ')}
              {(pagamento?.numeros.length || 0) > 5 ? '…' : ''}
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-semibold text-slate-700">Escaneie o QR Code</p>
              {qrBase64 ? (
                <div className="rounded-2xl border-4 border-green-500 p-2 shadow-md">
                  <img
                    src={`data:image/png;base64,${qrBase64}`}
                    alt="QR Code PIX"
                    className="h-52 w-52 rounded-xl"
                  />
                </div>
              ) : (
                <div className="flex h-52 w-52 items-center justify-center rounded-2xl bg-slate-100">
                  <QrCode className="h-16 w-16 text-slate-300" />
                </div>
              )}
              <p className="text-xs text-slate-400 text-center">
                Abra o app do seu banco → PIX → Ler QR Code
              </p>
            </div>

            {/* Divisor */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-xs font-medium text-slate-400">ou copie o código</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {/* Pix Copia e Cola */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                <p className="flex-1 truncate text-xs font-mono text-slate-600">
                  {pixCopiaECola || 'Código PIX indisponível'}
                </p>
              </div>
              <button
                onClick={copiar}
                className={[
                  'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all',
                  copiado
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                ].join(' ')}
              >
                {copiado ? (
                  <><CheckCircle2 className="h-4 w-4" /> Código copiado!</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copiar código PIX</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-700">Como pagar</p>
          {[
            'Abra o app do seu banco',
            'Acesse a área de PIX',
            'Escolha "Ler QR Code" ou "Copia e Cola"',
            'Confirme o pagamento',
            'Seus bilhetes serão ativados automaticamente!',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-slate-600">{step}</p>
            </div>
          ))}
        </div>

        {/* Status polling indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Verificando pagamento automaticamente…
        </div>

      </div>
    </div>
  )
}
