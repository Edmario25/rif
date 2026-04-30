import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Pencil, Ticket, Calendar, DollarSign } from 'lucide-react'

const statusMap: Record<string, { label: string; cls: string }> = {
  rascunho:  { label: 'Rascunho',  cls: 'bg-slate-100 text-slate-600' },
  ativa:     { label: 'Ativa',     cls: 'bg-green-100 text-green-700' },
  encerrada: { label: 'Encerrada', cls: 'bg-orange-100 text-orange-700' },
  sorteada:  { label: 'Sorteada',  cls: 'bg-blue-100 text-blue-700' },
  cancelada: { label: 'Cancelada', cls: 'bg-red-100 text-red-600' },
}

export const revalidate = 0

export default async function RifasAdminPage() {
  const supabase = createClient()
  const { data: rifas } = await supabase
    .from('rifas')
    .select('*')
    .order('criado_em', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rifas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie todas as rifas do sistema</p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/admin/rifas/nova"><Plus className="h-4 w-4 mr-2" />Nova Rifa</Link>
        </Button>
      </div>

      {/* Lista */}
      {!rifas?.length ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
            <Ticket className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">Nenhuma rifa cadastrada</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Crie sua primeira rifa para começar.</p>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/admin/rifas/nova"><Plus className="h-4 w-4 mr-2" />Nova Rifa</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Rifa</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Status</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Bilhetes</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Preço</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Sorteio</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Criada</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rifas.map((r) => {
                const s = statusMap[r.status] || statusMap.rascunho
                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 shrink-0">
                          <Ticket className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{r.titulo}</p>
                          {r.descricao && (
                            <p className="text-xs text-slate-400 truncate max-w-48">{r.descricao}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge className={`${s.cls} border-0 text-xs`}>{s.label}</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{r.total_bilhetes.toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-slate-600">
                        <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                        {formatCurrency(r.preco_bilhete)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {r.data_sorteio ? (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(r.data_sorteio)}
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">{formatDate(r.criado_em)}</td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/rifas/${r.id}`}
                        className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700 hover:underline">
                        <Pencil className="h-3.5 w-3.5" />Editar
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
