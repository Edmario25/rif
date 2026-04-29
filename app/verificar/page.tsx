'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function VerificarPage() {
  const router = useRouter()
  const supabase = createClient()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(600) // 10 min
  const [canResend, setCanResend] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const whatsapp = typeof window !== 'undefined' ? sessionStorage.getItem('otp_whatsapp') || '' : ''

  // Countdown do OTP
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Cooldown do botão reenviar
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
        setError(data.error || 'Código inválido.')
        setDigits(['', '', '', '', '', ''])
        inputs.current[0]?.focus()
        return
      }
      // Trocar hashed_token por sessão real no cliente
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
    await fetch('/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp }),
    })
    // Reinicia cooldown
    const interval = setInterval(() => {
      setResendCooldown((t) => {
        if (t <= 1) { setCanResend(true); clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <ShieldCheck className="h-7 w-7 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Verificar código</CardTitle>
          <CardDescription>
            Enviamos um código de 6 dígitos para o seu WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Inputs OTP */}
          <div className="flex justify-center gap-2">
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
                className="h-14 w-12 rounded-lg border-2 text-center text-xl font-bold focus:border-green-500 focus:outline-none disabled:opacity-50"
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center">
            {timer > 0 ? (
              <p className="text-sm text-muted-foreground">
                Código expira em <span className="font-medium text-green-600">{formatTimer(timer)}</span>
              </p>
            ) : (
              <p className="text-sm text-red-500">Código expirado. Solicite um novo.</p>
            )}
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={digits.join('').length < 6 || loading || timer === 0}
            onClick={handleVerify}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando…</>
            ) : (
              'Confirmar código'
            )}
          </Button>

          {/* Reenviar */}
          <p className="text-center text-sm text-muted-foreground">
            Não recebeu?{' '}
            {canResend ? (
              <button onClick={handleResend} className="text-green-600 underline">
                Reenviar código
              </button>
            ) : (
              <span className="opacity-50">Reenviar em {resendCooldown}s</span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
