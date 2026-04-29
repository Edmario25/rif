import { createClient } from '@/lib/supabase/server'
import { PremiadosAdminClient } from '@/components/admin/PremiadosAdminClient'

export default async function PremiadosAdminPage() {
  const supabase = createClient()

  const { data: rifas } = await supabase
    .from('rifas').select('id, titulo').order('criado_em', { ascending: false })

  const { data: ganhadores } = await supabase
    .from('ganhadores')
    .select('*, profiles(nome, whatsapp), premios(titulo), rifas(titulo)')
    .order('premiado_em', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🏆 Ganhadores</h1>
      <PremiadosAdminClient rifas={rifas || []} initialGanhadores={ganhadores || []} />
    </div>
  )
}
