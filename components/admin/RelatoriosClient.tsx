'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface RelatoriosClientProps {
  rifas: any[]
  bilhetes: any[]
  rifaAtiva: any
}

function exportCSV(filename: string, rows: string[][], headers: string[]) {
  const bom = '﻿'
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function RelatoriosClient({ rifas, bilhetes, rifaAtiva }: RelatoriosClientProps) {
  const pagos = bilhetes.filter((b) => b.status === 'pago')
  const reservados = bilhetes.filter((b) => b.status === 'reservado')
  const totalArrecadado = pagos.length * (rifaAtiva?.preco_bilhete || 0)

  function exportarBilhetes() {
    const rows = bilhetes.map((b) => [
      String(b.numero),
      b.status,
      b.profiles?.nome || '',
      b.profiles?.whatsapp || '',
      b.pago_em ? formatDate(b.pago_em) : '',
      b.conta_premiada ? 'SIM' : 'NÃO',
    ])
    exportCSV(
      `bilhetes-${rifaAtiva?.titulo || 'rifa'}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`,
      rows,
      ['Número', 'Status', 'Nome', 'WhatsApp', 'Data Pagamento', 'Conta Premiada']
    )
  }

  function exportarRifas() {
    const rows = rifas.map((r) => [
      r.titulo, r.status,
      String(r.total_bilhetes),
      formatCurrency(r.preco_bilhete),
      r.meta_arrecadacao ? formatCurrency(r.meta_arrecadacao) : '',
      r.data_sorteio ? formatDate(r.data_sorteio) : '',
    ])
    exportCSV(
      `rifas-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`,
      rows,
      ['Título', 'Status', 'Total Bilhetes', 'Preço', 'Meta', 'Data Sorteio']
    )
  }

  return (
    <div className="space-y-6">
      {rifaAtiva && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Arrecadado</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(totalArrecadado)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Bilhetes pagos</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{pagos.length} / {rifaAtiva.total_bilhetes}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Reservados</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-yellow-600">{reservados.length}</p></CardContent>
            </Card>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={exportarBilhetes}>
              <Download className="h-4 w-4 mr-2" /> Exportar bilhetes CSV
            </Button>
            <Button variant="outline" onClick={exportarRifas}>
              <Download className="h-4 w-4 mr-2" /> Exportar rifas CSV
            </Button>
          </div>
        </>
      )}

      {/* Tabela de bilhetes pagos */}
      {pagos.length > 0 && (
        <div className="rounded-lg border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nº</th>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">WhatsApp</th>
                <th className="px-4 py-3 text-left font-medium">Pago em</th>
                <th className="px-4 py-3 text-left font-medium">C. Premiada</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagos.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{b.numero}</td>
                  <td className="px-4 py-2">{b.profiles?.nome || '—'}</td>
                  <td className="px-4 py-2">{b.profiles?.whatsapp || '—'}</td>
                  <td className="px-4 py-2">{b.pago_em ? formatDate(b.pago_em) : '—'}</td>
                  <td className="px-4 py-2">{b.conta_premiada ? '⭐ Sim' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
