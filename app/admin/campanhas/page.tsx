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
      <h1 className="text-2xl font-bold">📣 Campanhas</h1>
      <CampanhasAdminClient rifas={rifas || []} initialCampanhas={campanhas || []} />
    </div>
  )
}
