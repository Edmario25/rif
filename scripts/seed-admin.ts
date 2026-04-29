/**
 * Seed script: cria o primeiro super_admin a partir do ADMIN_WHATSAPP do .env.local
 * Executar: npx ts-node --project tsconfig.json scripts/seed-admin.ts
 * Ou: npx tsx scripts/seed-admin.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ADMIN_WA     = process.env.ADMIN_WHATSAPP!

if (!SUPABASE_URL || !SERVICE_KEY || !ADMIN_WA) {
  console.error('❌ Variáveis de ambiente não configuradas. Verifique .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seed() {
  console.log(`\n🌱 Criando super_admin para WhatsApp: ${ADMIN_WA}\n`)

  const email = `${ADMIN_WA}@rifa-ecc.local`

  // Verificar se já existe
  const { data: users } = await supabase.auth.admin.listUsers()
  let userId = users.users.find((u) => u.email === email)?.id

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { whatsapp: ADMIN_WA, nome: 'Super Admin' },
    })
    if (error) { console.error('❌ Erro ao criar usuário:', error.message); process.exit(1) }
    userId = data.user!.id
    console.log('✅ Usuário criado:', userId)
  } else {
    console.log('ℹ️  Usuário já existe:', userId)
  }

  // Upsert profile como super_admin
  const { error: profileError } = await supabase.from('profiles').upsert(
    { id: userId, whatsapp: ADMIN_WA, nome: 'Super Admin', role: 'super_admin', ativo: true },
    { onConflict: 'id' }
  )
  if (profileError) { console.error('❌ Erro ao criar profile:', profileError.message); process.exit(1) }

  console.log('✅ Super admin configurado com sucesso!')
  console.log(`   WhatsApp: ${ADMIN_WA}`)
  console.log(`   Email interno: ${email}`)
  console.log('\n📱 Para acessar o painel admin, faça login com seu WhatsApp em /login\n')
}

seed().catch(console.error)
