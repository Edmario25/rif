import { createAdminClient } from '@/lib/supabase/admin'

// Endpoint para receber callbacks do n8n (ex: atualizar status de campanha)
export async function POST(request: Request) {
  const apiKey = request.headers.get('X-API-Key')
  if (apiKey !== process.env.N8N_API_KEY) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { tipo, ...payload } = body
  const admin = createAdminClient()

  switch (tipo) {
    case 'campanha_concluida': {
      const { campanha_id, total_enviados, total_erros } = payload
      await admin.from('campanhas').update({
        status: 'concluida',
        total_enviados,
        total_erros,
        enviado_em: new Date().toISOString(),
      }).eq('id', campanha_id)
      break
    }
    case 'campanha_erro': {
      await admin.from('campanhas').update({ status: 'erro' }).eq('id', payload.campanha_id)
      break
    }
    case 'mensagem_log': {
      await admin.from('mensagens_log').insert(payload)
      break
    }
    default:
      return Response.json({ error: 'Tipo desconhecido' }, { status: 400 })
  }

  return Response.json({ success: true })
}
