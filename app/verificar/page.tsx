'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, ShieldCheck, Ticket, ArrowLeft, MessageCircle } from 'lucide-react'

export default function VerificarPage() {
  const router = useRouter()
  const supabase = createClient()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(600)
  const [canResend, setCanResend] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const [resendDone, setResendDone] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const whatsapp = typeof window !== 'undefined' ? sessionStorage.getItem('otp_whatsapp') || '' : ''

  // Formata número para exibição
  const displayPhone = whatsapp.replace(/^55(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => { if (t <= 1) { clearInterval(interval); return 0 } return t - 1 })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setResendCooldown((t) => {
        if (t <= 1) { setCanResend(true); clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  function handleDigit(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    setError('')
    if (char && index < 5) inputs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      inputs.current[5]?.focus()
    }
  }

  async function handleVerify() {
    const codigo = digits.join('')
    if (codigo.length < 6) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp, codigo }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Código inválido. Verifique e tente novamente.')
        setDigits(['', '', '', '', '', ''])
        inputs.current[0]?.focus()
        return
      }
      const { error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: data.hashedToken,
        type: 'email',
      })
      if (sessionError) {
        setError('Erro ao iniciar sessão. Tente novamente.')
        return
      }
      sessionStorage.removeItem('otp_whatsapp')
      if (data.role === 'admin' || data.role === 'super_admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/cliente/dashboard')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!canResend || !whatsapp) return
    setCanResend(false)
    setResendCooldown(60)
    setTimer(600)
    setDigits(['', '', '', '', '', ''])
    setResendDone(false)
    await fetch('/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp }),
    })
    setResendDone(true)
    const interval = setInterval(() => {
      setResendCooldown((t) => {
        if (t <= 1) { setCanResend(true); clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
  }

  const filled = digits.filter(Boolean).length
  const progress = (filled / 6) * 100

  return (
    <div className="min-h-screen flex">

      {/* Painel esquerdo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-900 flex-col justify-between p-12">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Ticket className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-lg leading-tight">Rifa ECC</p>
            <p className="text-green-200 text-xs">Paróquia</p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight">
            Verificação<br />segura em<br />
            <span className="text-green-300">segundos.</span>
          </h1>
          <p className="text-green-100 text-base leading-relaxed max-w-xs">
            Seu código foi enviado via WhatsApp. Ele é válido por 10 minutos e pode ser usado uma única vez.
          </p>
        </div>

        <p className="relative z-10 text-xs text-green-300/70">
          © {new Date().getFullYear()} Paróquia ECC — Todos os direitos reservados
        </p>
      </div>

      {/* Painel direito */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12 bg-white">

        {/* Logo mobile */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600">
            <Ticket className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 leading-tight">Rifa ECC</p>
            <p className="text-slate-400 text-xs">Paróquia</p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-8">

          {/* Botão voltar */}
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          {/* Cabeçalho */}
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50">
              <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mt-4">Confirmar acesso</h2>
            <p className="text-slate-500 text-sm">
              Código enviado para{' '}
              <span className="font-semibold text-slate-700 flex items-center gap-1.5 mt-1">
                <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                {displayPhone || whatsapp}
              </span>
            </p>
          </div>

          {/* Inputs OTP */}
          <div className="space-y-4">
            <div className="flex justify-between gap-2">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  disabled={loading || timer === 0}
                  className={[
                    'h-14 w-full rounded-xl border-2 text-center text-2xl font-bold transition-all',
                    'focus:outline-none focus:ring-0 disabled:opacity-40',
                    d
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 bg-white text-slate-800',
                    error ? 'border-red-300 bg-red-50' : '',
                  ].join(' ')}
                />
              ))}
            </div>

            {/* Barra de progresso */}
            <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between">
            {timer > 0 ? (
              <p className="text-sm text-slate-500">
                Expira em{' '}
                <span className={`font-semibold ${timer < 60 ? 'text-red-500' : 'text-green-600'}`}>
                  {formatTimer(timer)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-red-500 font-medium">Código expirado</p>
            )}

            {canResend ? (
              <button
                onClick={handleResend}
                className="text-sm font-medium text-green-600 hover:text-green-700 underline"
              >
                Reenviar código
              </button>
            ) : (
              <p className="text-xs text-slate-400">
                Reenviar em {resendCooldown}s
              </p>
            )}
          </div>

          {resendDone && (
            <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 text-center">
              ✓ Novo código enviado no WhatsApp!
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          {timer === 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700 text-center">
              Seu código expirou. Clique em "Reenviar código" para receber um novo.
            </div>
          )}

          <Button
            className="w-full h-11 bg-green-600 hover:bg-green-700 font-semibold shadow-sm shadow-green-200"
            disabled={filled < 6 || loading || timer === 0}
            onClick={handleVerify}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando…</>
            ) : (
              <><ShieldCheck className="mr-2 h-4 w-4" />Confirmar código</>
            )}
          </Button>

          <p className="text-center text-xs text-slate-400">
            Problemas para receber? Verifique se o número está correto ou{' '}
            <button onClick={() => router.push('/login')} className="underline hover:text-slate-600">
              tente novamente
            </button>.
          </p>
        </div>
      </div>
    </div>
  )
}
