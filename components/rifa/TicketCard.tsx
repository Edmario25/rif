import { cn } from '@/lib/utils'

type TicketStatus = 'disponivel' | 'reservado' | 'pago' | 'cancelado'

interface TicketCardProps {
  numero: number
  status: TicketStatus
  contaPremiada: boolean
  onClick?: () => void
  disabled?: boolean
}

const statusConfig = {
  disponivel: 'bg-white border-gray-200 hover:border-green-400 hover:bg-green-50 cursor-pointer',
  reservado:  'bg-yellow-100 border-yellow-300 cursor-not-allowed',
  pago:       'bg-green-500 border-green-600 text-white cursor-not-allowed',
  cancelado:  'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed',
}

export function TicketCard({ numero, status, contaPremiada: _hidden, onClick, disabled }: TicketCardProps) {
  return (
    <button
      type="button"
      onClick={status === 'disponivel' && !disabled ? onClick : undefined}
      className={cn(
        'relative flex h-10 w-full items-center justify-center rounded border text-sm font-medium transition-colors',
        statusConfig[status],
        disabled && status === 'disponivel' && 'opacity-50 cursor-not-allowed'
      )}
      title={`Bilhete #${numero} — ${status}`}
    >
      {numero}
    </button>
  )
}
