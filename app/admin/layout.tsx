import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/admin/Sidebar'
import { Bell } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nome, whatsapp')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/')
  }

  // Buscar nome do sistema nas configurações
  const { data: config } = await supabase
    .from('configuracoes')
    .select('nome_sistema')
    .single()

  const nomeSistema = config?.nome_sistema || 'Rifa ECC'

  const initials = (profile.nome || 'A')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm shrink-0">
          <div>
            <p className="text-sm font-semibold text-slate-800">{nomeSistema}</p>
            <p className="text-xs text-slate-400">Painel Administrativo</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Notificação (placeholder) */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
              <Bell className="h-4 w-4 text-slate-500" />
            </button>

            {/* Avatar + info */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white text-xs font-bold shadow">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-800 leading-tight">{profile.nome}</p>
                <p className="text-xs text-slate-400">
                  {profile.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
