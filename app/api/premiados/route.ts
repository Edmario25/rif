import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callN8nWebhook } from '@/lib/n8n'

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ganhadores')
    .select('*, profiles(nome, whatsapp), premios(titulo), rifas(titulo), bilhetes(numero)')
    .order('premiado_em', { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const admin = createAdminClient()

  // Buscar bilhete pelo número para vincular ao ganhador
  const { data: bilhete } = await admin
    .from('bilhetes')
    .select('id, cliente_id, numero')
    .eq('rifa_id', body.rifa_id)
    .eq('numero', body.numero_sorteado)
    .eq('status', 'pago')
    .single()

  const payload = {
    rifa_id: body.rifa_id,
    premio_id: body.premio_id,
    numero_sorteado: body.numero_sorteado,
    observacao: body.observacao,
    publicar: body.publicar || false,
    bilhete_id: bilhete?.id || null,
    cliente_id: bilhete?.cliente_id || null,
  }

  const { data, error } = await admin.from('ganhadores').insert(payload).select().single()
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data, { status: 201 })
}

export async function PUT(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { id, notificar, ...body } = await request.json()
  const admin = createAdminClient()
  const { data, error } = await admin.from('ganhadores').update(body).eq('id', id).select().single()
  if (error) return Response.json({ error: error.message }, { status: 400 })

  // Disparar notificação WhatsApp via n8n se solicitado
  if (notificar) {
    try {
      await callN8nWebhook('ganhador', { ganhador_id: id })
    } catch (err) {
      console.error('Erro ao notificar ganhador via n8n:', err)
    }
  }

  return Response.json(data)
}
