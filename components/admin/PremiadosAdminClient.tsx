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

      {/* Lista de ganhadores */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Ganhadores registrados</h2>
        </div>
        {ganhadores.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 mb-3">
              <Trophy className="h-6 w-6 text-yellow-400" />
            </div>
            <p className="text-sm text-slate-500">Nenhum ganhador registrado ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {ganhadores.map((g) => (
              <div key={g.id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-50">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{g.profiles?.nome || 'Contemplado'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bilhete #{g.numero_sorteado}
                      {g.premios?.titulo && ` · ${g.premios.titulo}`}
                      {g.rifas?.titulo && ` · ${g.rifas.titulo}`}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(g.premiado_em)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Publicar</span>
                    <Switch checked={g.publicar} onCheckedChange={() => togglePublicar(g)} />
                  </div>
                  {g.profiles?.whatsapp && (
                    <Button variant="outline" size="sm" onClick={() => notificar(g)} disabled={notificando === g.id}
                      className="h-7 text-xs border-slate-200">
                      <MessageCircle className="h-3.5 w-3.5 mr-1 text-green-600" />
                      {notificando === g.id ? 'Enviando…' : 'Notificar WA'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
