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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Ganhadores</h1>
        <p className="text-sm text-slate-500 mt-0.5">Registre os ganhadores e notifique via WhatsApp</p>
      </div>
      <PremiadosAdminClient rifas={rifas || []} initialGanhadores={ganhadores || []} />
    </div>
  )
}
