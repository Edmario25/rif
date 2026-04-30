import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { data } = await supabase
    .from('pagamentos')
    .select('id, status, numeros, valor, expira_em, criado_em')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!data) return Response.json({ error: 'Pagamento não encontrado' }, { status: 404 })

  return Response.json(data)
}
