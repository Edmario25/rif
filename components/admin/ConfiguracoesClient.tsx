'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Save, Settings2, MessageCircle, Palette } from 'lucide-react'

interface Config {
  nome_sistema?: string
  subtitulo?: string
  logo_url?: string
  whatsapp_suporte?: string
}

export function ConfiguracoesClient({ initialConfig }: { initialConfig: Config }) {
  const [form, setForm] = useState<Config>({
    nome_sistema: initialConfig.nome_sistema || 'Rifa ECC',
    subtitulo: initialConfig.subtitulo || 'Paróquia',
    logo_url: initialConfig.logo_url || '',
    whatsapp_suporte: initialConfig.whatsapp_suporte || '',
  })
  const [salvando, setSalvando] = useState(false)

  const update = (field: keyof Config) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  async function salvar() {
    setSalvando(true)
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Configurações salvas! Recarregue a página para ver as alterações.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Identidade */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base">Identidade do Sistema</CardTitle>
          </div>
          <CardDescription>Nome e aparência exibidos no painel e para os participantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Nome do sistema</label>
            <Input value={form.nome_sistema} onChange={update('nome_sistema')} placeholder="Rifa ECC" />
            <p className="text-xs text-slate-400">Aparece no topo do painel e na landing page.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Subtítulo / organização</label>
            <Input value={form.subtitulo} onChange={update('subtitulo')} placeholder="Paróquia" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">URL da logo</label>
            <Input value={form.logo_url} onChange={update('logo_url')} placeholder="https://...imagem.png" />
            <p className="text-xs text-slate-400">Imagem exibida na landing page. Use o Storage do Supabase para hospedar.</p>
            {form.logo_url && (
              <img src={form.logo_url} alt="Logo preview"
                className="mt-2 h-16 w-auto rounded-lg border object-contain bg-white p-1" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base">Contato & Suporte</CardTitle>
          </div>
          <CardDescription>Informações de contato exibidas para os participantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">WhatsApp de suporte</label>
            <Input value={form.whatsapp_suporte} onChange={update('whatsapp_suporte')}
              placeholder="5574999999999" />
            <p className="text-xs text-slate-400">Número para dúvidas dos participantes (com DDI 55).</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={salvar} disabled={salvando} className="bg-green-600 hover:bg-green-700">
        <Save className="h-4 w-4 mr-2" />
        {salvando ? 'Salvando…' : 'Salvar configurações'}
      </Button>
    </div>
  )
}
