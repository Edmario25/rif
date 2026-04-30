import { createAdminClient } from '@/lib/supabase/admin'
import { UsuariosClient } from '@/components/admin/UsuariosClient'

export const revalidate = 0

export default async function UsuariosAdminPage() {
  const admin = createAdminClient()

  const { data: usuarios } = await admin
    .from('profiles')
    .select('id, nome, whatsapp, role, ativo, criado_em')
    .order('criado_em', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gerencie participantes e administradores</p>
      </div>
      <UsuariosClient initialUsuarios={usuarios || []} />
    </div>
  )
}
