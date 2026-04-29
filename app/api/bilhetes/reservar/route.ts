import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { bilhete_id, rifa_id } = await request.json()
  if (!bilhete_id || !rifa_id) {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Verificar se bilhete ainda está disponível (operação atômica)
  const { data: bilhete, error: fetchError } = await adminSupabase
    .from('bilhetes')
    .select('id, status, numero')
    .eq('id', bilhete_id)
    .eq('rifa_id', rifa_id)
    .eq('status', 'disponivel')
    .single()

  if (fetchError || !bilhete) {
    return Response.json({ error: 'Bilhete não disponível.' }, { status: 409 })
  }

  // Reservar
  const { error: updateError } = await adminSupabase
    .from('bilhetes')
    .update({
      status: 'reservado',
      cliente_id: user.id,
      reservado_em: new Date().toISOString(),
    })
    .eq('id', bilhete_id)
    .eq('status', 'disponivel') // garante que não houve race condition

  if (updateError) {
    return Response.json({ error: 'Bilhete não disponível.' }, { status: 409 })
  }

  return Response.json({ success: true, numero: bilhete.numero })
}
