'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  titulo: z.string().min(3, 'Título muito curto'),
  descricao: z.string().optional(),
  total_bilhetes: z.coerce.number().min(1).max(100000),
  preco_bilhete: z.coerce.number().min(0.01),
  meta_arrecadacao: z.coerce.number().optional(),
  data_sorteio: z.string().optional(),
  metodo_sorteio: z.string().default('loteria_federal'),
  pix_chave: z.string().optional(),
  pix_nome: z.string().optional(),
  status: z.enum(['rascunho', 'ativa', 'encerrada', 'sorteada', 'cancelada']).default('rascunho'),
})

type FormValues = z.infer<typeof schema>

interface RifaFormProps {
  rifa?: FormValues & { id?: string; imagem_url?: string }
}

export function RifaForm({ rifa }: RifaFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: rifa || {
      titulo: '', descricao: '', total_bilhetes: 200,
      preco_bilhete: 10, status: 'rascunho', metodo_sorteio: 'loteria_federal',
    },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      let imagemUrl = rifa?.imagem_url

      if (imageFile) {
        const path = `rifas/${Date.now()}-${imageFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('rifas-imagens').upload(path, imageFile, { upsert: true })
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('rifas-imagens').getPublicUrl(path)
          imagemUrl = publicUrl
        }
      }

      const payload = { ...values, imagem_url: imagemUrl, ...(rifa?.id ? { id: rifa.id } : {}) }
      const res = await fetch('/api/rifas', {
        method: rifa?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(rifa?.id ? 'Rifa atualizada!' : 'Rifa criada! Bilhetes gerados automaticamente.')
      router.push('/admin/rifas')
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar rifa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <FormField control={form.control} name="titulo" render={({ field }) => (
          <FormItem>
            <FormLabel>Título da rifa *</FormLabel>
            <FormControl><Input placeholder="Ex: Rifa Beneficente ECC 2025" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="descricao" render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl><Textarea placeholder="Descrição da rifa..." rows={3} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="total_bilhetes" render={({ field }) => (
            <FormItem>
              <FormLabel>Total de bilhetes *</FormLabel>
              <FormControl><Input type="number" min={1} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="preco_bilhete" render={({ field }) => (
            <FormItem>
              <FormLabel>Preço por bilhete (R$) *</FormLabel>
              <FormControl><Input type="number" step="0.01" min={0.01} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="meta_arrecadacao" render={({ field }) => (
            <FormItem>
              <FormLabel>Meta de arrecadação (R$)</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="data_sorteio" render={({ field }) => (
            <FormItem>
              <FormLabel>Data do sorteio</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="pix_chave" render={({ field }) => (
            <FormItem>
              <FormLabel>Chave PIX</FormLabel>
              <FormControl><Input placeholder="CPF, e-mail, telefone ou aleatória" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="pix_nome" render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do titular PIX</FormLabel>
              <FormControl><Input placeholder="Nome exibido no PIX" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="ativa">Ativa (publicada)</SelectItem>
                <SelectItem value="encerrada">Encerrada</SelectItem>
                <SelectItem value="sorteada">Sorteada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="space-y-2">
          <label className="text-sm font-medium">Imagem da rifa</label>
          {rifa?.imagem_url && !imageFile && (
            <img src={rifa.imagem_url} alt="Imagem atual" className="h-32 rounded-lg object-cover" />
          )}
          <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {rifa?.id ? 'Salvar alterações' : 'Criar rifa'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/rifas')}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
