import { RifaForm } from '@/components/admin/RifaForm'

export default function NovaRifaPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nova Rifa</h1>
      <p className="text-muted-foreground text-sm">
        Ao criar a rifa, os bilhetes serão gerados automaticamente.
      </p>
      <RifaForm />
    </div>
  )
}
