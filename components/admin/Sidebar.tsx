'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Ticket, Trophy, Users, Megaphone,
  BarChart2, Star, LogOut, Settings, ChevronRight, Gift
} from 'lucide-react'

const navGroups = [
  {
    label: 'Principal',
    items: [
      { href: '/admin/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
      { href: '/admin/rifas',          label: 'Rifas',          icon: Ticket },
      { href: '/admin/bilhetes',       label: 'Bilhetes',       icon: Star },
      { href: '/admin/premios',        label: 'Prêmios',        icon: Gift },
    ],
  },
  {
    label: 'Participantes',
    items: [
      { href: '/admin/usuarios',       label: 'Usuários',       icon: Users },
      { href: '/admin/premiados',      label: 'Ganhadores',     icon: Trophy },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/admin/campanhas',      label: 'Campanhas',      icon: Megaphone },
      { href: '/admin/relatorios',     label: 'Relatórios',     icon: BarChart2 },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/configuracoes',  label: 'Configurações',  icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white shrink-0">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500 shadow-lg shadow-green-500/20">
          <Ticket className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">Rifa ECC</p>
          <p className="text-xs text-slate-400">Painel Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-green-500 text-white shadow-sm shadow-green-500/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                    {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-70" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-800">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
