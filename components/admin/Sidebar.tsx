'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Ticket, Trophy, Users, Megaphone,
  BarChart2, Star, LogOut, ChevronRight
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/admin/rifas',      label: 'Rifas',            icon: Ticket },
  { href: '/admin/bilhetes',   label: 'Bilhetes',         icon: Star },
  { href: '/admin/premios',    label: 'Prêmios',          icon: Trophy },
  { href: '/admin/premiados',  label: 'Ganhadores',       icon: Trophy },
  { href: '/admin/campanhas',  label: 'Campanhas',        icon: Megaphone },
  { href: '/admin/relatorios', label: 'Relatórios',       icon: BarChart2 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-56 flex-col border-r bg-white">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Ticket className="h-5 w-5 text-green-600" />
        <span className="font-bold text-green-700">Rifa ECC Admin</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
              {active && <ChevronRight className="ml-auto h-3 w-3" />}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-2">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
