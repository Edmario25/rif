import { createClient } from '@/lib/supabase/server'
import { ConfiguracoesClient } from '@/components/admin/ConfiguracoesClient'

export const revalidate = 0

export default async function ConfiguracoesPage() {
  const supabase = createClient()
  const { data: config } = await supabase.from('configuracoes').select('*').single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
        <p className="text-sm text-slate-500 mt-0.5">Personalize o sistema de rifas</p>
      </div>
      <ConfiguracoesClient initialConfig={config || {}} />
    </div>
  )
}
