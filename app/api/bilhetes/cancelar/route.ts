import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { bilhete_id } = await request.json()
  const admin = createAdminClient()

  const { error } = await admin
    .from('bilhetes')
    .update({ status: 'cancelado', cliente_id: null, reservado_em: null })
    .eq('id', bilhete_id)
    .in('status', ['reservado']) // Só cancela reservados; pagos exigem ação manual

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
