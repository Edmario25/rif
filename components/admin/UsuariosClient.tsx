'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Search, UserCheck, UserX, Pencil, Phone } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Usuario {
  id: string
  nome: string
  whatsapp: string
  role: string
  ativo: boolean
  criado_em: string
}

const roleLabels: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700' },
  admin:       { label: 'Admin',       color: 'bg-blue-100 text-blue-700' },
  cliente:     { label: 'Cliente',     color: 'bg-slate-100 text-slate-600' },
}

export function UsuariosClient({ initialUsuarios }: { initialUsuarios: Usuario[] }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios)
  const [busca, setBusca] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [form, setForm] = useState({ nome: '', whatsapp: '', role: 'cliente' })
  const [salvando, setSalvando] = useState(false)

  const filtrados = usuarios.filter(u => {
    if (!busca) return true
    const q = busca.toLowerCase()
    return u.nome?.toLowerCase().includes(q) || u.whatsapp?.includes(q)
  })

  function abrirNovoUsuario() {
    setEditando(null)
    setForm({ nome: '', whatsapp: '', role: 'cliente' })
    setShowModal(true)
  }

  function abrirEdicao(u: Usuario) {
    setEditando(u)
    setForm({ nome: u.nome, whatsapp: u.whatsapp, role: u.role })
    setShowModal(true)
  }

  async function salvar() {
    if (!form.nome || !form.whatsapp) { toast.error('Preencha nome e WhatsApp'); return }
    setSalvando(true)
    try {
      if (editando) {
        const res = await fetch('/api/usuarios', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editando.id, nome: form.nome, role: form.role, ativo: editando.ativo }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error); return }
        setUsuarios(prev => prev.map(u => u.id === editando.id ? { ...u, nome: form.nome, role: form.role } : u))
        toast.success('Usuário atualizado!')
      } else {
        const res = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error); return }
        // Recarregar lista
        const listRes = await fetch('/api/usuarios')
        const lista = await listRes.json()
        setUsuarios(lista)
        toast.success('Usuário criado! Ele pode fazer login pelo WhatsApp.')
      }
      setShowModal(false)
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivo(u: Usuario) {
    const res = await fetch('/api/usuarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, nome: u.nome, role: u.role, ativo: !u.ativo }),
    })
    if (res.ok) {
      setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, ativo: !x.ativo } : x))
      toast.success(u.ativo ? 'Usuário desativado' : 'Usuário ativado')
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de ações */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome ou telefone…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <Button onClick={abrirNovoUsuario} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <p className="text-xs text-slate-400">{filtrados.length} usuário(s) encontrado(s)</p>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Nome</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">WhatsApp</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Função</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Status</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs">Cadastro</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">Nenhum usuário encontrado.</td></tr>
            )}
            {filtrados.map(u => {
              const rl = roleLabels[u.role] || roleLabels.cliente
              return (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-white text-xs font-bold shrink-0">
                        {(u.nome || '?')[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{u.nome || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {u.whatsapp}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={`${rl.color} border-0 text-xs`}>{rl.label}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={u.ativo ? 'bg-green-100 text-green-700 border-0 text-xs' : 'bg-red-100 text-red-600 border-0 text-xs'}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {u.criado_em ? formatDate(u.criado_em) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => abrirEdicao(u)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => toggleAtivo(u)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700">
                        {u.ativo ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal novo/editar */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Nome completo</label>
              <Input placeholder="Ex: João da Silva" value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            {!editando && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">WhatsApp</label>
                <Input placeholder="5574999999999 (com DDI)" value={form.whatsapp}
                  onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                <p className="text-xs text-slate-400">Formato: 55 + DDD + número (ex: 5574999991234)</p>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Função</label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={salvar} disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
