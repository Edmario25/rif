import { createAdminClient } from '@/lib/supabase/admin'
import { callN8nWebhook } from '@/lib/n8n'

export async function POST(request: Request) {
  const { whatsapp } = await request.json()
  const numero = whatsapp.replace(/\D/g, '')

  if (numero.length < 12) {
    return Response.json({ error: 'Número inválido. Use o formato com DDD e DDI (ex: 5511999999999).' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Rate limit: máx 3 OTPs por número por hora
  const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await adminSupabase
    .from('otp_whatsapp')
    .select('*', { count: 'exact', head: true })
    .eq('whatsapp', numero)
    .gt('criado_em', umaHoraAtras)

  if (count && count >= 3) {
    return Response.json(
      { error: 'Muitas tentativas. Aguarde 1 hora para solicitar um novo código.' },
      { status: 429 }
    )
  }

  // Gerar OTP 6 dígitos
  const codigo = Math.floor(100000 + Math.random() * 900000).toString()

  await adminSupabase.from('otp_whatsapp').insert({
    whatsapp: numero,
    codigo,
    expira_em: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  })

  // Disparar n8n → Evolution API envia WhatsApp
  try {
    await callN8nWebhook('otp', {
      whatsapp: numero,
      codigo,
      mensagem: `🔐 *Rifa ECC – Paróquia*\n\nSeu código de acesso:\n\n*${codigo}*\n\n_Válido por 10 minutos. Não compartilhe este código._`,
    })
  } catch (err) {
    console.error('Erro ao disparar OTP via n8n:', err)
    // Não falhar o request — OTP foi salvo, usuário pode tentar novamente
  }

  return Response.json({ success: true })
}
