'use client'

import { useState } from 'react'
import { PremiadoForm } from './PremiadoForm'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { MessageCircle, Trophy } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface Ganhador {
  id: string
  numero_sorteado: number
  publicar: boolean
  observacao?: string
  premiado_em: string
  profiles: { nome: string; whatsapp: string } | null
  premios: { titulo: string } | null
  rifas: { titulo: string } | null
}

export function PremiadosAdminClient({ rifas, initialGanhadores }: { rifas: any[]; initialGanhadores: Ganhador[] }) {
  const [ganhadores, setGanhadores] = useState<Ganhador[]>(initialGanhadores)
  const [notificando, setNotificando] = useState<string | null>(null)

  function onSuccess(novo: Ganhador) {
    setGanhadores((prev) => [novo, ...prev])
  }

  async function togglePublicar(g: Ganhador) {
    const res = await fetch('/api/premiados', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: g.id, publicar: !g.publicar }),
    })
    if (res.ok) {
      setGanhadores((prev) => prev.map((x) => x.id === g.id ? { ...x, publicar: !x.publicar } : x))
      toast.success(!g.publicar ? 'Publicado na página pública!' : 'Ocultado da página pública.')
    }
  }

  async function notificar(g: Ganhador) {
    setNotificando(g.id)
    const res = await fetch('/api/premiados', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: g.id, publicar: g.publicar, notificar: true }),
    })
    if (res.ok) toast.success('Notificação enviada via WhatsApp!')
    else toast.error('Erro ao notificar.')
    setNotificando(null)
  }

  return (
    <div className="space-y-6">
      <PremiadoForm rifas={rifas} onSuccess={onSuccess} />

      <div className="space-y-3">
        {ganhadores.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">Nenhum ganhador registrado.</p>
        )}
        {ganhadores.map((g) => (
          <Card key={g.id}>
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-semibold">{g.profiles?.nome || 'Contemplado'}</p>
                  <p className="text-sm text-muted-foreground">
                    Bilhete #{g.numero_sorteado}
                    {g.premios?.titulo && ` · ${g.premios.titulo}`}
                    {g.rifas?.titulo && ` · ${g.rifas.titulo}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(g.premiado_em)}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Publicar</span>
                  <Switch checked={g.publicar} onCheckedChange={() => togglePublicar(g)} />
                </div>
                {g.profiles?.whatsapp && (
                  <Button variant="outline" size="sm" onClick={() => notificar(g)} disabled={notificando === g.id}>
                    <MessageCircle className="h-4 w-4 mr-1 text-green-600" />
                    {notificando === g.id ? 'Enviando…' : 'Notificar WA'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
