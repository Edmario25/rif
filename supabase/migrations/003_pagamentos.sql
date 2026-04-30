-- ============================================
-- Tabela de pagamentos (Mercado Pago PIX)
-- ============================================
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  mp_payment_id    TEXT        UNIQUE,
  rifa_id          UUID        REFERENCES public.rifas(id) ON DELETE CASCADE,
  user_id          UUID        REFERENCES auth.users(id)   ON DELETE CASCADE,
  numeros          INTEGER[]   NOT NULL DEFAULT '{}',
  valor            DECIMAL(10,2) NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pendente',
    -- pendente | aprovado | cancelado | expirado | em_processamento
  qr_code          TEXT,
  qr_code_base64   TEXT,
  pix_copia_cola   TEXT,
  expira_em        TIMESTAMPTZ,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_user   ON public.pagamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_rifa   ON public.pagamentos(rifa_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_mp_id  ON public.pagamentos(mp_payment_id);

-- Atualiza atualizado_em automaticamente
CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_pagamentos_atualizado_em ON public.pagamentos;
CREATE TRIGGER trg_pagamentos_atualizado_em
  BEFORE UPDATE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- RLS
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_ver_proprio"
  ON public.pagamentos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "usuario_inserir_proprio"
  ON public.pagamentos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_tudo"
  ON public.pagamentos FOR ALL
  USING (public.is_admin());
