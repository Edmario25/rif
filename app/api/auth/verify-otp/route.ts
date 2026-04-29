import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const { whatsapp, codigo, nome } = await request.json()
  const numero = whatsapp.replace(/\D/g, '')

  if (!numero || !codigo) {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Verificar OTP válido
  const { data: otp, error } = await adminSupabase
    .from('otp_whatsapp')
    .select()
    .eq('whatsapp', numero)
    .eq('codigo', codigo)
    .eq('usado', false)
    .gt('expira_em', new Date().toISOString())
    .single()

  if (error || !otp) {
    return Response.json({ error: 'Código inválido ou expirado.' }, { status: 401 })
  }

  // Marcar OTP como usado
  await adminSupabase.from('otp_whatsapp').update({ usado: true }).eq('id', otp.id)

  // Email fictício para o Supabase Auth
  const email = `${numero}@rifa-ecc.local`
  let userId: string

  // Verificar se usuário já existe
  const { data: existingUsers } = await adminSupabase.auth.admin.listUsers()
  const existingUser = existingUsers.users.find((u) => u.email === email)

  if (existingUser) {
    userId = existingUser.id
  } else {
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { whatsapp: numero, nome: nome || '' },
    })
    if (createError || !newUser.user) {
      return Response.json({ error: 'Erro ao criar conta.' }, { status: 500 })
    }
    userId = newUser.user.id
  }

  // Upsert profile
  const isAdmin = numero === process.env.ADMIN_WHATSAPP
  await adminSupabase.from('profiles').upsert(
    {
      id: userId,
      whatsapp: numero,
      nome: nome || `Cliente ${numero.slice(-4)}`,
      role: isAdmin ? 'super_admin' : 'cliente',
    },
    { onConflict: 'id' }
  )

  // Gerar magic link para obter tokens de sessão
  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData.properties) {
    return Response.json({ error: 'Erro ao gerar sessão.' }, { status: 500 })
  }

  return Response.json({
    success: true,
    hashedToken: linkData.properties.hashed_token,
    userId,
    role: isAdmin ? 'super_admin' : 'cliente',
  })
}
