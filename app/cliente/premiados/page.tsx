import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Trophy } from 'lucide-react'

export const revalidate = 60

export default async function PremiadosClientePage() {
  const supabase = createClient()

  const { data: ganhadores } = await supabase
    .from('ganhadores')
    .select('*, profiles(nome), premios(titulo, descricao), rifas(titulo)')
    .eq('publicar', true)
    .order('premiado_em', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🏆 Contemplados</h1>

      {!ganhadores || ganhadores.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Trophy className="h-14 w-14 text-gray-200" />
          <p className="text-muted-foreground">Nenhum ganhador publicado ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ganhadores.map((g: any) => (
            <div key={g.id} className="flex gap-4 rounded-xl border bg-yellow-50 p-4 items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-200">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{g.profiles?.nome || 'Contemplado'}</p>
                <p className="text-sm text-muted-foreground">
                  🎟️ Bilhete #{g.numero_sorteado} — {g.premios?.titulo}
                </p>
                <p className="text-xs text-muted-foreground">
                  {g.rifas?.titulo} · {formatDate(g.premiado_em)}
                </p>
                {g.observacao && <p className="mt-1 text-xs italic text-gray-600">"{g.observacao}"</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
