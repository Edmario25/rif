import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Gift, Pencil, Trophy } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0

export default async function PremiosAdminPage() {
  const supabase = createClient()

  const { data: premios } = await supabase
    .from('premios')
    .select('*, rifas(id, titulo, status)')
    .order('ordem')

  const { data: rifas } = await supabase
    .from('rifas')
    .select('id, titulo, status')
    .order('criado_em', { ascending: false })

  // Agrupar prêmios por rifa
  const porRifa = new Map<string, { rifa: any; premios: any[] }>()
  premios?.forEach((p) => {
    const rifaId = p.rifa_id
    if (!porRifa.has(rifaId)) {
      porRifa.set(rifaId, { rifa: p.rifas, premios: [] })
    }
    porRifa.get(rifaId)!.premios.push(p)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Prêmios</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie os prêmios de cada rifa</p>
        </div>
      </div>

      {porRifa.size === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
            <Gift className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">Nenhum prêmio cadastrado</p>
          <p className="text-sm text-slate-400 mt-1">Crie uma rifa e adicione prêmios nas configurações dela.</p>
          <Button asChild className="mt-4 bg-green-600 hover:bg-green-700">
            <Link href="/admin/rifas">Ir para Rifas</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(porRifa.entries()).map(([rifaId, { rifa, premios: ps }]) => (
            <div key={rifaId} className="bg-white rounded-xl border-0 shadow-sm overflow-hidden">
              {/* Header da rifa */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-slate-800">{rifa?.titulo || 'Rifa'}</p>
                    <Badge className={
                      rifa?.status === 'ativa'
                        ? 'bg-green-100 text-green-700 border-0 text-xs mt-0.5'
                        : 'bg-slate-100 text-slate-600 border-0 text-xs mt-0.5'
                    }>
                      {rifa?.status || '—'}
                    </Badge>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/rifas/${rifaId}?tab=premios`}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar prêmios
                  </Link>
                </Button>
              </div>

              {/* Lista de prêmios */}
              <div className="divide-y divide-slate-50">
                {ps.map((p) => (
                  <div key={p.id} className="flex items-center gap-4 px-6 py-3">
                    {p.imagem_url ? (
                      <img src={p.imagem_url} alt={p.titulo} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-50 shrink-0">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{p.titulo}</p>
                      {p.descricao && <p className="text-xs text-slate-400 truncate">{p.descricao}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className="text-xs">{p.tipo || 'principal'}</Badge>
                      <p className="text-xs text-slate-400 mt-0.5">#{p.ordem}º lugar</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rifas sem prêmios */}
      {rifas && rifas.filter(r => !porRifa.has(r.id)).length > 0 && (
        <div className="bg-white rounded-xl border-0 shadow-sm p-6">
          <p className="text-sm font-medium text-slate-600 mb-3">Rifas sem prêmios cadastrados:</p>
          <div className="flex flex-wrap gap-2">
            {rifas.filter(r => !porRifa.has(r.id)).map(r => (
              <Link key={r.id} href={`/admin/rifas/${r.id}?tab=premios`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-slate-50 text-xs py-1 px-3">
                  {r.titulo} →
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
