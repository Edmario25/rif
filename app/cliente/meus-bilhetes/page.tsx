'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Star, Upload, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Bilhete {
  id: string
  numero: number
  status: string
  conta_premiada: boolean
  pago_em: string | null
  reservado_em: string | null
  comprovante_url: string | null
  rifa_id: string
  rifas: { titulo: string; preco_bilhete: number } | null
}

interface Rifa {
  id: string
  titulo: string
}

export default function MeusBilhetesPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [bilhetes, setBilhetes] = useState<Bilhete[]>([])
  const [rifas, setRifas] = useState<Rifa[]>([])
  const [rifaFiltro, setRifaFiltro] = useState(searchParams.get('rifa') || 'todas')
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('bilhetes')
        .select('id, numero, status, conta_premiada, pago_em, reservado_em, comprovante_url, rifa_id, rifas(titulo, preco_bilhete)')
        .eq('cliente_id', user.id)
        .in('status', ['reservado', 'pago'])
        .order('numero')

      setBilhetes((data as unknown as Bilhete[]) || [])

      // Extrair rifas únicas
      const uniqueRifas = new Map<string, string>()
      data?.forEach((b: any) => {
        if (!uniqueRifas.has(b.rifa_id)) uniqueRifas.set(b.rifa_id, b.rifas?.titulo || 'Rifa')
      })
      setRifas(Array.from(uniqueRifas.entries()).map(([id, titulo]) => ({ id, titulo })))
      setLoading(false)
    }
    fetchData()
  }, [])

  async function handleUploadComprovante(bilheteId: string, file: File) {
    setUploadingId(bilheteId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const path = `${user.id}/${bilheteId}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('comprovantes').upload(path, file)
    if (error) {
      toast.error('Erro ao enviar comprovante.')
      setUploadingId(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('comprovantes').getPublicUrl(path)
    await supabase.from('bilhetes').update({ comprovante_url: publicUrl }).eq('id', bilheteId)
    setBilhetes((prev) => prev.map((b) => b.id === bilheteId ? { ...b, comprovante_url: publicUrl } : b))
    toast.success('Comprovante enviado! Aguarde a confirmação.')
    setUploadingId(null)
  }

  const filtered = rifaFiltro === 'todas' ? bilhetes : bilhetes.filter((b) => b.rifa_id === rifaFiltro)

  if (loading) return <div className="animate-pulse space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-200" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">🎟️ Meus Bilhetes</h1>
        {rifas.length > 1 && (
          <Select value={rifaFiltro} onValueChange={setRifaFiltro}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por rifa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as rifas</SelectItem>
              {rifas.map((r) => <SelectItem key={r.id} value={r.id}>{r.titulo}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">Nenhum bilhete encontrado.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((b) => (
            <Card key={b.id} className={b.conta_premiada ? 'border-yellow-400 bg-yellow-50' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold">Bilhete #{b.numero}</p>
                    <p className="text-xs text-muted-foreground">{(b.rifas as any)?.titulo}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={b.status === 'pago' ? 'default' : 'outline'}
                      className={b.status === 'pago' ? 'bg-green-600' : 'border-yellow-400 text-yellow-700'}>
                      {b.status === 'pago' ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" />Pago</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" />Aguardando</>
                      )}
                    </Badge>
                    {b.conta_premiada && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-400">
                        <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                        Conta Premiada!
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {b.pago_em && <p>Pago em {formatDate(b.pago_em)}</p>}
                  {!b.pago_em && b.reservado_em && <p>Reservado em {formatDate(b.reservado_em)}</p>}
                </div>

                {b.status === 'reservado' && !b.comprovante_url && (
                  <div>
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingId === b.id ? 'Enviando...' : 'Enviar comprovante PIX'}
                        </span>
                      </Button>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        disabled={uploadingId === b.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUploadComprovante(b.id, file)
                        }}
                      />
                    </label>
                  </div>
                )}

                {b.comprovante_url && (
                  <p className="text-xs text-green-600">✓ Comprovante enviado — aguardando confirmação</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
