import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RifaForm } from '@/components/admin/RifaForm'
import { PremiosAdmin } from '@/components/admin/PremiosAdmin'
import { ContasPremiadasAdmin } from '@/components/admin/ContasPremiadasAdmin'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ChevronRight, Ticket } from 'lucide-react'

export default async function EditarRifaPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: rifa } = await supabase.from('rifas').select('*').eq('id', params.id).single()
  if (!rifa) notFound()

  const { data: premios } = await supabase
    .from('premios').select('*').eq('rifa_id', params.id).order('ordem')

  const { data: contasPremiadas } = await supabase
    .from('contas_premiadas').select('*').eq('rifa_id', params.id).order('numero_bilhete')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <Link href="/admin/rifas" className="hover:text-slate-600">Rifas</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-600 truncate max-w-xs">{rifa.titulo}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <Ticket className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{rifa.titulo}</h1>
            <p className="text-sm text-slate-500 mt-0.5">Gerencie dados, prêmios e contas premiadas desta rifa</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="geral">
        <TabsList className="bg-slate-100 border-0">
          <TabsTrigger value="geral" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Dados Gerais</TabsTrigger>
          <TabsTrigger value="premios" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Prêmios</TabsTrigger>
          <TabsTrigger value="contas" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Contas Premiadas</TabsTrigger>
        </TabsList>
        <TabsContent value="geral" className="pt-5">
          <RifaForm rifa={rifa} />
        </TabsContent>
        <TabsContent value="premios" className="pt-5">
          <PremiosAdmin rifaId={params.id} initialPremios={premios || []} />
        </TabsContent>
        <TabsContent value="contas" className="pt-5">
          <ContasPremiadasAdmin
            rifaId={params.id}
            totalBilhetes={rifa.total_bilhetes}
            initialContas={contasPremiadas || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
