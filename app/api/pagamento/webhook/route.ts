import { createAdminClient } from '@/lib/supabase/admin'
import { mpPayment } from '@/lib/mercadopago'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('[MP Webhook]', JSON.stringify(body))

    // MP envia type="payment" com data.id
    if (body.type !== 'payment' || !body.data?.id) {
      return Response.json({ ok: true })
    }

    const mpId = String(body.data.id)

    // Buscar detalhes do pagamento no MP
    const mp = await mpPayment.get({ id: mpId })
    const status = mp.status // approved | pending | rejected | cancelled | in_process
    const externalRef = mp.external_reference // nosso pagamento.id

    if (!externalRef) {
      console.warn('[MP Webhook] sem external_reference')
      return Response.json({ ok: true })
    }

    const admin = createAdminClient()

    // Buscar pagamento interno
    const { data: pagamento } = await admin
      .from('pagamentos')
      .select('*, profiles:user_id(nome, whatsapp)')
      .eq('id', externalRef)
      .single()

    if (!pagamento) {
      console.warn('[MP Webhook] pagamento não encontrado:', externalRef)
      return Response.json({ ok: true })
    }

    // Já processado? Evitar duplicatas
    if (pagamento.status === 'aprovado') {
      return Response.json({ ok: true })
    }

    const novoStatus =
      status === 'approved'    ? 'aprovado'         :
      status === 'rejected'    ? 'cancelado'         :
      status === 'cancelled'   ? 'cancelado'         :
      status === 'in_process'  ? 'em_processamento'  :
      'pendente'

    // Atualizar status do pagamento
    await admin
      .from('pagamentos')
      .update({ status: novoStatus, mp_payment_id: mpId })
      .eq('id', externalRef)

    if (novoStatus === 'aprovado') {
      // Marcar bilhetes como pagos
      const { data: bilhetes } = await admin
        .from('bilhetes')
        .select('id, numero, conta_premiada')
        .eq('rifa_id', pagamento.rifa_id)
        .in('numero', pagamento.numeros)

      if (bilhetes?.length) {
        await admin
          .from('bilhetes')
          .update({ status: 'pago', pago_em: new Date().toISOString() })
          .in('id', bilhetes.map((b: any) => b.id))

        // Disparar notificação WhatsApp via n8n
        const contasPremiadas = bilhetes.filter((b: any) => b.conta_premiada)
        const payload = {
          user_id: pagamento.user_id,
          whatsapp: (pagamento as any).profiles?.whatsapp,
          nome: (pagamento as any).profiles?.nome,
          numeros: pagamento.numeros,
          valor: pagamento.valor,
          rifa_id: pagamento.rifa_id,
          tem_conta_premiada: contasPremiadas.length > 0,
          contas_premiadas: contasPremiadas.map((b: any) => b.numero),
        }

        const n8nUrl = process.env.N8N_WEBHOOK_CONFIRMACAO_URL
        if (n8nUrl) {
          await fetch(n8nUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': process.env.N8N_API_KEY || '',
            },
            body: JSON.stringify(payload),
          }).catch((e) => console.error('[Webhook n8n]', e))
        }
      }
    } else if (novoStatus === 'cancelado') {
      // Liberar bilhetes reservados
      await admin
        .from('bilhetes')
        .update({ status: 'disponivel', reservado_em: null })
        .eq('rifa_id', pagamento.rifa_id)
        .in('numero', pagamento.numeros)
        .eq('status', 'reservado')
    }

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error('[MP Webhook Error]', err)
    return Response.json({ ok: true }) // sempre 200 para o MP não ficar reenviando
  }
}
