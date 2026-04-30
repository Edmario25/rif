-- Tabela de configurações do sistema (linha única)
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id          BOOLEAN DEFAULT TRUE PRIMARY KEY CHECK (id),
  nome_sistema TEXT NOT NULL DEFAULT 'Rifa ECC',
  subtitulo    TEXT DEFAULT 'Paróquia',
  logo_url     TEXT,
  whatsapp_suporte TEXT,
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.configuracoes (id) VALUES (TRUE) ON CONFLICT DO NOTHING;

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público pode ler config" ON public.configuracoes FOR SELECT USING (true);
CREATE POLICY "Admin gerencia config"   ON public.configuracoes FOR ALL   USING (public.is_admin());
