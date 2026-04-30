import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET — listar todos os usuários
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return Response.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, nome, whatsapp, role, ativo, criado_em')
    .order('criado_em', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(profiles)
}

// POST — criar usuário manualmente
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return Response.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { nome, whatsapp, role = 'cliente' } = await request.json()
  if (!nome || !whatsapp) return Response.json({ error: 'Nome e WhatsApp são obrigatórios' }, { status: 400 })

  const numero = whatsapp.replace(/\D/g, '')
  const email = `${numero}@rifa-ecc.local`
  const admin = createAdminClient()

  // Verificar se já existe
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  let userId = existingUsers?.users.find(u => u.email === email)?.id

  if (!userId) {
    const { data: newUser, error } = await admin.auth.admin.createUser({
      email, email_confirm: true,
      user_metadata: { whatsapp: numero, nome },
    })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    userId = newUser.user!.id
  }

  const { error: profileError } = await admin.from('profiles').upsert(
    { id: userId, whatsapp: numero, nome, role, ativo: true },
    { onConflict: 'id' }
  )
  if (profileError) return Response.json({ error: profileError.message }, { status: 500 })

  return Response.json({ success: true, userId })
}

// PUT — atualizar usuário
export async function PUT(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return Response.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { id, nome, role, ativo } = await request.json()
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('profiles')
    .update({ nome, role, ativo })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
