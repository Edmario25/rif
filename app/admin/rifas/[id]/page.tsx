import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RifaForm } from '@/components/admin/RifaForm'
import { PremiosAdmin } from '@/components/admin/PremiosAdmin'
import { ContasPremiadasAdmin } from '@/components/admin/ContasPremiadasAdmin'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
      <h1 className="text-2xl font-bold">Editar Rifa</h1>
      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Dados Gerais</TabsTrigger>
          <TabsTrigger value="premios">Prêmios</TabsTrigger>
          <TabsTrigger value="contas">Contas Premiadas</TabsTrigger>
        </TabsList>
        <TabsContent value="geral" className="pt-4">
          <RifaForm rifa={rifa} />
        </TabsContent>
        <TabsContent value="premios" className="pt-4">
          <PremiosAdmin rifaId={params.id} initialPremios={premios || []} />
        </TabsContent>
        <TabsContent value="contas" className="pt-4">
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
