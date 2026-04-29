import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callN8nWebhook } from '@/lib/n8n'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { campanha_id } = await request.json()
  const admin = createAdminClient()

  // Atualizar status para 'enviando'
  await admin.from('campanhas').update({ status: 'enviando' }).eq('id', campanha_id)

  // Disparar n8n Workflow 3
  try {
    await callN8nWebhook('campanha', { campanha_id })
  } catch (err) {
    await admin.from('campanhas').update({ status: 'erro' }).eq('id', campanha_id)
    return Response.json({ error: 'Erro ao disparar campanha.' }, { status: 500 })
  }

  return Response.json({ success: true })
}
