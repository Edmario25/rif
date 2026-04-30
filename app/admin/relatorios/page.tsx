import { createClient } from '@/lib/supabase/server'
import { RelatoriosClient } from '@/components/admin/RelatoriosClient'

export default async function RelatoriosPage() {
  const supabase = createClient()

  const { data: rifas } = await supabase
    .from('rifas').select('id, titulo, total_bilhetes, preco_bilhete, meta_arrecadacao, data_sorteio, status')
    .order('criado_em', { ascending: false })

  // Para a rifa ativa, buscar estatísticas detalhadas
  const rifaAtiva = rifas?.find((r) => r.status === 'ativa')

  let bilhetesStats: any[] = []
  if (rifaAtiva) {
    const { data } = await supabase
      .from('bilhetes')
      .select('id, numero, status, conta_premiada, pago_em, profiles(nome, whatsapp)')
      .eq('rifa_id', rifaAtiva.id)
      .in('status', ['pago', 'reservado'])
      .order('numero')
    bilhetesStats = data || []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
        <p className="text-sm text-slate-500 mt-0.5">Estatísticas detalhadas e exportação de dados</p>
      </div>
      <RelatoriosClient rifas={rifas || []} bilhetes={bilhetesStats} rifaAtiva={rifaAtiva} />
    </div>
  )
}
