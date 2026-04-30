import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { criarPagamentoPix } from '@/lib/mercadopago'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const admin = createAdminClient()

    // Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

    const { rifa_id, qty } = await request.json()
    if (!rifa_id || !qty || qty < 1) {
      return Response.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Buscar rifa
    const { data: rifa } = await supabase
      .from('rifas').select('*').eq('id', rifa_id).single()
    if (!rifa || rifa.status !== 'ativa') {
      return Response.json({ error: 'Rifa não encontrada ou inativa' }, { status: 404 })
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles').select('nome, whatsapp').eq('id', user.id).single()

    // Buscar bilhetes disponíveis
    const { data: bilhetesDisponiveis } = await admin
      .from('bilhetes')
      .select('id, numero')
      .eq('rifa_id', rifa_id)
      .eq('status', 'disponivel')
      .limit(qty)

    if (!bilhetesDisponiveis || bilhetesDisponiveis.length < qty) {
      return Response.json({
        error: `Apenas ${bilhetesDisponiveis?.length || 0} bilhetes disponíveis.`,
      }, { status: 400 })
    }

    const numerosEscolhidos = bilhetesDisponiveis.slice(0, qty)
    const ids = numerosEscolhidos.map((b) => b.id)
    const numeros = numerosEscolhidos.map((b) => b.numero)
    const valor = Number((rifa.preco_bilhete * qty).toFixed(2))

    // Criar registro de pagamento ANTES de chamar MP (pra ter o ID)
    const { data: pagamento, error: errPag } = await admin
      .from('pagamentos')
      .insert({
        rifa_id,
        user_id: user.id,
        numeros,
        valor,
        status: 'pendente',
      })
      .select('id')
      .single()

    if (errPag || !pagamento) {
      return Response.json({ error: 'Erro ao registrar pagamento' }, { status: 500 })
    }

    // Reservar bilhetes
    await admin
      .from('bilhetes')
      .update({ status: 'reservado', reservado_em: new Date().toISOString() })
      .in('id', ids)

    // Criar PIX no Mercado Pago
    const mp = await criarPagamentoPix({
      valor,
      descricao: `${qty} bilhete${qty > 1 ? 's' : ''} — ${rifa.titulo}`,
      email: `${profile?.whatsapp || user.id}@rifa-ecc.local`,
      nome: profile?.nome || 'Cliente ECC',
      externalReference: pagamento.id,
    })

    const qrCode      = mp.point_of_interaction?.transaction_data?.qr_code || ''
    const qrBase64    = mp.point_of_interaction?.transaction_data?.qr_code_base64 || ''
    const expiraEm    = mp.date_of_expiration || new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const mpPaymentId = String(mp.id || '')

    // Atualizar pagamento com dados do MP
    await admin
      .from('pagamentos')
      .update({
        mp_payment_id: mpPaymentId,
        qr_code: qrCode,
        qr_code_base64: qrBase64,
        pix_copia_cola: qrCode,
        expira_em: expiraEm,
      })
      .eq('id', pagamento.id)

    return Response.json({
      pagamento_id: pagamento.id,
      qr_code: qrCode,
      qr_code_base64: qrBase64,
      valor,
      numeros,
      expira_em: expiraEm,
    })
  } catch (err: any) {
    console.error('[/api/pagamento/criar]', err)
    return Response.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
