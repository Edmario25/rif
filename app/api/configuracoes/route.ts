import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createClient()
  const { data } = await supabase.from('configuracoes').select('*').single()
  return Response.json(data || {})
}

export async function PUT(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return Response.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await request.json()
  const admin = createAdminClient()
  const { error } = await admin.from('configuracoes').upsert(
    { id: true, ...body, atualizado_em: new Date().toISOString() },
    { onConflict: 'id' }
  )
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
