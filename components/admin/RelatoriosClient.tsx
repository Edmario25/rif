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
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total arrecadado</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalArrecadado)}</p>
              <p className="text-xs text-slate-400 mt-0.5">{rifaAtiva.titulo}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Bilhetes pagos</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{pagos.length} <span className="text-base font-normal text-slate-400">/ {rifaAtiva.total_bilhetes}</span></p>
              <p className="text-xs text-slate-400 mt-0.5">{Math.round((pagos.length / rifaAtiva.total_bilhetes) * 100)}% do total</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Reservados</p>
              <p className="text-2xl font-bold text-yellow-500 mt-1">{reservados.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Aguardando confirmação</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={exportarBilhetes} className="border-slate-200 text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4 mr-2" /> Exportar bilhetes CSV
            </Button>
            <Button variant="outline" onClick={exportarRifas} className="border-slate-200 text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4 mr-2" /> Exportar rifas CSV
            </Button>
          </div>
        </>
      )}

      {/* Tabela de bilhetes pagos */}
      {pagos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Bilhetes pagos — {rifaAtiva?.titulo}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Nº</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Cliente</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">WhatsApp</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Pago em</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">C. Premiada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagos.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-800">#{b.numero}</td>
                    <td className="px-5 py-3 text-slate-600">{b.profiles?.nome || '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{b.profiles?.whatsapp || '—'}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{b.pago_em ? formatDate(b.pago_em) : '—'}</td>
                    <td className="px-5 py-3 text-xs">
                      {b.conta_premiada ? <span className="text-yellow-600 font-medium">⭐ Sim</span> : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!rifaAtiva && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-3">
            <Download className="h-7 w-7 text-slate-300" />
          </div>
          <p className="text-slate-500 text-sm">Nenhuma rifa ativa no momento.</p>
          <p className="text-xs text-slate-400 mt-1">Ative uma rifa para visualizar relatórios.</p>
        </div>
      )}
    </div>
  )
}
