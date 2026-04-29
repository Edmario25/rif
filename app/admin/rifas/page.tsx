import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'

const statusColors: Record<string, string> = {
  rascunho:  'bg-gray-100 text-gray-700',
  ativa:     'bg-green-100 text-green-700',
  encerrada: 'bg-orange-100 text-orange-700',
  sorteada:  'bg-blue-100 text-blue-700',
  cancelada: 'bg-red-100 text-red-700',
}

export default async function RifasAdminPage() {
  const supabase = createClient()
  const { data: rifas } = await supabase
    .from('rifas')
    .select('*')
    .order('criado_em', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rifas</h1>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/admin/rifas/nova"><Plus className="h-4 w-4 mr-2" />Nova rifa</Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bilhetes</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Sorteio</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rifas?.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.titulo}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[r.status]}`}>
                    {r.status}
                  </span>
                </TableCell>
                <TableCell>{r.total_bilhetes}</TableCell>
                <TableCell>{formatCurrency(r.preco_bilhete)}</TableCell>
                <TableCell>{r.data_sorteio ? formatDate(r.data_sorteio) : '—'}</TableCell>
                <TableCell>{formatDate(r.criado_em)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/rifas/${r.id}`}><Pencil className="h-4 w-4" /></Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!rifas?.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma rifa cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
