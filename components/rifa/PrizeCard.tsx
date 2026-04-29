import { Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Premio {
  id: string
  titulo: string
  descricao?: string
  imagem_url?: string
  ordem: number
  tipo: 'sorteio' | 'conta_premiada' | 'bonus'
}

interface PrizeCardProps {
  premio: Premio
}

const tipoLabel = {
  sorteio: { label: '🏆 Sorteio', class: 'bg-yellow-100 text-yellow-800' },
  conta_premiada: { label: '⭐ Conta Premiada', class: 'bg-purple-100 text-purple-800' },
  bonus: { label: '🎁 Bônus', class: 'bg-blue-100 text-blue-800' },
}

export function PrizeCard({ premio }: PrizeCardProps) {
  const tipo = tipoLabel[premio.tipo]

  return (
    <Card className="overflow-hidden">
      {premio.imagem_url ? (
        <img
          src={premio.imagem_url}
          alt={premio.titulo}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-200">
          <Trophy className="h-16 w-16 text-yellow-500" />
        </div>
      )}
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight">{premio.titulo}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${tipo.class}`}>
            {tipo.label}
          </span>
        </div>
        {premio.descricao && (
          <p className="text-xs text-muted-foreground">{premio.descricao}</p>
        )}
      </CardContent>
    </Card>
  )
}
