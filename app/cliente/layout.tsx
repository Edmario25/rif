import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Ticket, Trophy, LogOut } from 'lucide-react'

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/cliente/dashboard" className="flex items-center gap-2 font-bold text-green-700">
            <Ticket className="h-5 w-5" />
            <span>Rifa ECC</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cliente/dashboard"><Home className="h-4 w-4 mr-1" />Início</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cliente/meus-bilhetes"><Ticket className="h-4 w-4 mr-1" />Bilhetes</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cliente/premiados"><Trophy className="h-4 w-4 mr-1" />Ganhadores</Link>
            </Button>
            <form action="/api/auth/signout" method="POST">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </nav>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}
