import { createClient } from '@/lib/supabase/server'
import { CampanhasAdminClient } from '@/components/admin/CampanhasAdminClient'

export default async function CampanhasAdminPage() {
  const supabase = createClient()
  const { data: rifas } = await supabase.from('rifas').select('id, titulo').order('criado_em', { ascending: false })
  const { data: campanhas } = await supabase
    .from('campanhas')
    .select('*, rifas(titulo)')
    .order('criado_em', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Campanhas</h1>
        <p className="text-sm text-slate-500 mt-0.5">Envie mensagens em massa para os participantes via WhatsApp</p>
      </div>
      <CampanhasAdminClient rifas={rifas || []} initialCampanhas={campanhas || []} />
    </div>
  )
}
