'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, MessageCircle } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <MessageCircle className="h-7 w-7 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Entrar via WhatsApp</CardTitle>
          <CardDescription>
            Digite seu número de celular e enviaremos um código de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Número de celular</label>
              <Input
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                inputMode="numeric"
                autoComplete="tel"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
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
            <p className="text-center text-xs text-muted-foreground">
              Ao continuar, você concorda com os termos de uso da Rifa ECC.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
