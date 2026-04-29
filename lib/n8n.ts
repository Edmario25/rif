type N8nWebhook = 'otp' | 'confirmacao' | 'campanha' | 'ganhador'

const webhookUrls: Record<N8nWebhook, string | undefined> = {
  otp: process.env.N8N_WEBHOOK_OTP_URL,
  confirmacao: process.env.N8N_WEBHOOK_CONFIRMACAO_URL,
  campanha: process.env.N8N_WEBHOOK_CAMPANHA_URL,
  ganhador: process.env.N8N_WEBHOOK_GANHADOR_URL,
}

export async function callN8nWebhook(webhook: N8nWebhook, body: object) {
  const url = webhookUrls[webhook]
  if (!url) throw new Error(`URL do webhook n8n "${webhook}" não configurada`)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.N8N_API_KEY!,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`n8n webhook "${webhook}" falhou: ${res.status} ${text}`)
  }

  return res
}
