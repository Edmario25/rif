import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callN8nWebhook } from '@/lib/n8n'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { bilhete_id } = await request.json()
  const admin = createAdminClient()

  // Buscar bilhete com dados do cliente e rifa
  const { data: bilhete, error } = await admin
    .from('bilhetes')
    .select('*, profiles(nome, whatsapp), rifas(titulo, data_sorteio)')
    .eq('id', bilhete_id)
    .single()

  if (error || !bilhete) return Response.json({ error: 'Bilhete não encontrado.' }, { status: 404 })
  if (bilhete.status === 'pago') return Response.json({ error: 'Bilhete já confirmado.' }, { status: 409 })

  // Confirmar pagamento
  const { error: updateError } = await admin
    .from('bilhetes')
    .update({ status: 'pago', pago_em: new Date().toISOString() })
    .eq('id', bilhete_id)

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  // Disparar n8n Workflow 2 (confirmação com check de conta premiada)
  try {
    await callN8nWebhook('confirmacao', {
      bilhete_id,
      cliente_id: bilhete.cliente_id,
      rifa_id: bilhete.rifa_id,
      numero: bilhete.numero,
      conta_premiada: bilhete.conta_premiada,
    })
  } catch (err) {
    console.error('Erro ao chamar webhook de confirmação n8n:', err)
  }

  return Response.json({ success: true })
}
