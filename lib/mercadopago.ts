import MercadoPagoConfig, { Payment } from 'mercadopago'

export interface CriarPixParams {
  valor: number
  descricao: string
  email: string
  nome: string
  externalReference: string  // nosso pagamento.id
}

export async function criarPagamentoPix(params: CriarPixParams) {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) {
    throw new Error('MP_ACCESS_TOKEN não configurado no servidor')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const client = new MercadoPagoConfig({ accessToken: token })
  const mpPayment = new Payment(client)

  const result = await mpPayment.create({
    body: {
      transaction_amount: params.valor,
      payment_method_id: 'pix',
      description: params.descricao,
      external_reference: params.externalReference,
      notification_url: `${appUrl}/api/pagamento/webhook`,
      date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
      payer: {
        email: params.email,
        first_name: params.nome.split(' ')[0] || 'Cliente',
        last_name: params.nome.split(' ').slice(1).join(' ') || 'ECC',
      },
    },
  })

  return result
}
