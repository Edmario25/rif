'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, MessageCircle, Ticket, Shield, Zap, Trophy } from 'lucide-react'
import { sanitizeWhatsApp } from '@/lib/utils'

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  return value
}

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const numero = sanitizeWhatsApp(phone)
    if (numero.length < 12) {
      setError('Digite um número de celular válido com DDD.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: numero }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao enviar código.')
        return
      }
      sessionStorage.setItem('otp_whatsapp', numero)
      router.push('/verificar')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Painel esquerdo (decorativo) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-900 flex-col justify-between p-12">

        {/* Círculos decorativos de fundo */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-white/5" />

        {/* Bilhetes flutuantes decorativos */}
        <div className="absolute top-24 right-16 rotate-12 opacity-20">
          <div className="flex h-16 w-28 items-center justify-center rounded-xl bg-white shadow-xl">
            <span className="text-2xl font-black text-green-700">042</span>
          </div>
        </div>
        <div className="absolute bottom-40 right-24 -rotate-6 opacity-20">
          <div className="flex h-16 w-28 items-center justify-center rounded-xl bg-white shadow-xl">
            <span className="text-2xl font-black text-green-700">187</span>
          </div>
        </div>
        <div className="absolute top-1/2 left-8 rotate-3 opacity-10">
          <div className="flex h-14 w-24 items-center justify-center rounded-xl bg-white shadow-xl">
            <span className="text-xl font-black text-green-700">315</span>
          </div>
        </div>

        {/* Logo / Topo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Ticket className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-lg leading-tight">Rifa ECC</p>
            <p className="text-green-200 text-xs">Paróquia</p>
          </div>
        </div>

        {/* Texto central */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Sua chance de<br />ganhar começa<br />
              <span className="text-green-300">aqui.</span>
            </h1>
            <p className="text-green-100 text-base leading-relaxed max-w-xs">
              Participe das rifas beneficentes da Paróquia ECC. Rápido, seguro e direto pelo WhatsApp.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Zap,     text: 'Acesso instantâneo via WhatsApp' },
              { icon: Shield,  text: 'Pagamento seguro via PIX' },
              { icon: Trophy,  text: 'Sorteio transparente e verificável' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4 text-green-200" />
                </div>
                <p className="text-sm text-green-100">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé esquerdo */}
        <p className="relative z-10 text-xs text-green-300/70">
          © {new Date().getFullYear()} Paróquia ECC — Todos os direitos reservados
        </p>
      </div>

      {/* ── Painel direito (formulário) ── */}
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

          {/* Cabeçalho */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Entrar na sua conta</h2>
            <p className="text-slate-500 text-sm">
              Enviaremos um código de 6 dígitos no seu WhatsApp.
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Número de celular
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                  <MessageCircle className="h-4 w-4 text-slate-400" />
                </div>
                <Input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  inputMode="numeric"
                  autoComplete="tel"
                  disabled={loading}
                  className="pl-10 h-11 border-slate-200 focus-visible:ring-green-500"
                />
              </div>
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 mt-1">
                  <span className="text-xs text-red-600">{error}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm shadow-green-200 transition-all"
              disabled={loading || phone.replace(/\D/g, '').length < 10}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando código…
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Receber código no WhatsApp
                </>
              )}
            </Button>
          </form>

          {/* Divisor */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs text-slate-400">Como funciona?</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          {/* Passos */}
          <div className="space-y-3">
            {[
              { step: '1', text: 'Digite seu número com DDD' },
              { step: '2', text: 'Receba o código no WhatsApp' },
              { step: '3', text: 'Entre e escolha seu bilhete' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-50 text-xs font-bold text-green-700">
                  {step}
                </div>
                <p className="text-sm text-slate-500">{text}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-400">
            Ao continuar, você concorda com os{' '}
            <span className="underline cursor-pointer hover:text-slate-600">termos de uso</span>{' '}
            da Rifa ECC.
          </p>
        </div>
      </div>
    </div>
  )
}
