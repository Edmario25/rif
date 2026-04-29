-- =====================================================
-- SCHEMA SISTEMA RIFA ECC
-- Rodar no SQL Editor do Supabase Studio
-- =====================================================

-- 1. PERFIS DE USUÁRIO
CREATE TABLE profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  whatsapp       TEXT NOT NULL UNIQUE,
  role           TEXT NOT NULL DEFAULT 'cliente'
                 CHECK (role IN ('cliente','admin','super_admin')),
  ativo          BOOLEAN DEFAULT TRUE,
  criado_em      TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RIFAS
CREATE TABLE rifas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo              TEXT NOT NULL,
  descricao           TEXT,
  imagem_url          TEXT,
  total_bilhetes      INTEGER NOT NULL DEFAULT 200,
  preco_bilhete       NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  meta_arrecadacao    NUMERIC(10,2),
  data_sorteio        DATE,
  metodo_sorteio      TEXT DEFAULT 'loteria_federal',
  resultado_sorteio   TEXT,
  status              TEXT NOT NULL DEFAULT 'rascunho'
                      CHECK (status IN ('rascunho','ativa','encerrada','sorteada','cancelada')),
  pix_chave           TEXT,
  pix_nome            TEXT,
  criado_em           TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRÊMIOS
CREATE TABLE premios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rifa_id     UUID NOT NULL REFERENCES rifas(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  descricao   TEXT,
  imagem_url  TEXT,
  ordem       INTEGER DEFAULT 1,
  tipo        TEXT DEFAULT 'sorteio'
              CHECK (tipo IN ('sorteio','conta_premiada','bonus')),
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CONTAS PREMIADAS
CREATE TABLE contas_premiadas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rifa_id          UUID NOT NULL REFERENCES rifas(id) ON DELETE CASCADE,
  numero_bilhete   INTEGER NOT NULL,
  premio_id        UUID REFERENCES premios(id),
  descricao_premio TEXT NOT NULL,
  ativo            BOOLEAN DEFAULT TRUE,
  UNIQUE(rifa_id, numero_bilhete)
);

-- 5. BILHETES
CREATE TABLE bilhetes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rifa_id          UUID NOT NULL REFERENCES rifas(id) ON DELETE CASCADE,
  numero           INTEGER NOT NULL,
  cliente_id       UUID REFERENCES profiles(id),
  status           TEXT NOT NULL DEFAULT 'disponivel'
                   CHECK (status IN ('disponivel','reservado','pago','cancelado')),
  reservado_em     TIMESTAMPTZ,
  pago_em          TIMESTAMPTZ,
  comprovante_url  TEXT,
  conta_premiada   BOOLEAN DEFAULT FALSE,
  notificado       BOOLEAN DEFAULT FALSE,
  criado_em        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rifa_id, numero)
);

-- 6. GANHADORES
CREATE TABLE ganhadores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rifa_id          UUID NOT NULL REFERENCES rifas(id),
  bilhete_id       UUID REFERENCES bilhetes(id),
  premio_id        UUID REFERENCES premios(id),
  cliente_id       UUID REFERENCES profiles(id),
  numero_sorteado  INTEGER,
  observacao       TEXT,
  publicar         BOOLEAN DEFAULT FALSE,
  premiado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CAMPANHAS DE MARKETING
CREATE TABLE campanhas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rifa_id          UUID REFERENCES rifas(id),
  titulo           TEXT NOT NULL,
  mensagem         TEXT NOT NULL,
  tipo             TEXT NOT NULL
                   CHECK (tipo IN ('todos','compradores','nao_compradores','reservados','personalizado')),
  status           TEXT DEFAULT 'rascunho'
                   CHECK (status IN ('rascunho','agendada','enviando','concluida','erro')),
  agendado_para    TIMESTAMPTZ,
  enviado_em       TIMESTAMPTZ,
  total_enviados   INTEGER DEFAULT 0,
  total_erros      INTEGER DEFAULT 0,
  n8n_execution_id TEXT,
  criado_por       UUID REFERENCES profiles(id),
  criado_em        TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LOG DE MENSAGENS
CREATE TABLE mensagens_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id  UUID REFERENCES campanhas(id),
  cliente_id   UUID REFERENCES profiles(id),
  whatsapp     TEXT NOT NULL,
  mensagem     TEXT NOT NULL,
  status       TEXT DEFAULT 'enviado'
               CHECK (status IN ('enviado','entregue','erro')),
  erro         TEXT,
  enviado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- 9. OTP WHATSAPP (login)
CREATE TABLE otp_whatsapp (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp   TEXT NOT NULL,
  codigo     TEXT NOT NULL,
  usado      BOOLEAN DEFAULT FALSE,
  expira_em  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_bilhetes_rifa_status  ON bilhetes(rifa_id, status);
CREATE INDEX idx_bilhetes_cliente      ON bilhetes(cliente_id);
CREATE INDEX idx_otp_whatsapp          ON otp_whatsapp(whatsapp, codigo);
CREATE INDEX idx_campanhas_status      ON campanhas(status, agendado_para);
CREATE INDEX idx_ganhadores_rifa       ON ganhadores(rifa_id, publicar);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rifas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bilhetes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE premios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_premiadas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ganhadores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_whatsapp      ENABLE ROW LEVEL SECURITY;

-- Helper: verificar se é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Rifas: públicas para leitura (ativas), admin gerencia tudo
CREATE POLICY "rifas_leitura_publica" ON rifas
  FOR SELECT USING (status = 'ativa');
CREATE POLICY "rifas_admin_full" ON rifas
  FOR ALL USING (is_admin());

-- Bilhetes: cliente vê os seus, admin vê todos
-- Leitura pública de disponíveis (para grade da landing page)
CREATE POLICY "bilhetes_leitura_publica" ON bilhetes
  FOR SELECT USING (true);
CREATE POLICY "bilhetes_proprio" ON bilhetes
  FOR SELECT USING (cliente_id = auth.uid());
CREATE POLICY "bilhetes_admin_full" ON bilhetes
  FOR ALL USING (is_admin());

-- Prêmios: leitura pública, admin gerencia
CREATE POLICY "premios_leitura" ON premios
  FOR SELECT USING (true);
CREATE POLICY "premios_admin_full" ON premios
  FOR ALL USING (is_admin());

-- Contas premiadas: leitura pública, admin gerencia
CREATE POLICY "contas_premiadas_leitura" ON contas_premiadas
  FOR SELECT USING (true);
CREATE POLICY "contas_premiadas_admin_full" ON contas_premiadas
  FOR ALL USING (is_admin());

-- Ganhadores: somente publicados ficam públicos
CREATE POLICY "ganhadores_publicados" ON ganhadores
  FOR SELECT USING (publicar = true);
CREATE POLICY "ganhadores_admin_full" ON ganhadores
  FOR ALL USING (is_admin());

-- Perfil: usuário vê e edita o próprio, admin vê todos
CREATE POLICY "profile_proprio" ON profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "profile_update_proprio" ON profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profile_admin_full" ON profiles
  FOR ALL USING (is_admin());

-- Campanhas: somente admin
CREATE POLICY "campanhas_admin_full" ON campanhas
  FOR ALL USING (is_admin());

-- Log de mensagens: somente admin
CREATE POLICY "mensagens_log_admin_full" ON mensagens_log
  FOR ALL USING (is_admin());

-- OTP: service role gerencia (sem policy de usuário — acesso via service role key)
CREATE POLICY "otp_service_role" ON otp_whatsapp
  FOR ALL USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Gerar bilhetes automaticamente ao criar rifa
CREATE OR REPLACE FUNCTION gerar_bilhetes_rifa()
RETURNS TRIGGER AS $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 1..NEW.total_bilhetes LOOP
    INSERT INTO bilhetes (rifa_id, numero, status)
    VALUES (NEW.id, i, 'disponivel');
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gerar_bilhetes
  AFTER INSERT ON rifas
  FOR EACH ROW EXECUTE FUNCTION gerar_bilhetes_rifa();

-- Marcar bilhete como conta_premiada quando configurado
CREATE OR REPLACE FUNCTION marcar_conta_premiada()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bilhetes
  SET conta_premiada = NEW.ativo
  WHERE rifa_id = NEW.rifa_id AND numero = NEW.numero_bilhete;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marcar_conta_premiada
  AFTER INSERT OR UPDATE ON contas_premiadas
  FOR EACH ROW EXECUTE FUNCTION marcar_conta_premiada();

-- Atualizar atualizado_em em profiles e rifas
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_atualizado_em
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trigger_rifas_atualizado_em
  BEFORE UPDATE ON rifas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- =====================================================
-- SUPABASE STORAGE BUCKETS
-- Rodar via Supabase Studio → Storage → New Bucket
-- OU via SQL abaixo
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('rifas-imagens', 'rifas-imagens', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('comprovantes', 'comprovantes', false)
  ON CONFLICT (id) DO NOTHING;

-- Policy: admin pode fazer upload de imagens
CREATE POLICY "admin_upload_imagens"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'rifas-imagens' AND is_admin());

CREATE POLICY "admin_select_imagens"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rifas-imagens');

-- Policy: cliente faz upload do próprio comprovante
CREATE POLICY "cliente_upload_comprovante"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'comprovantes'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "cliente_select_comprovante"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'comprovantes'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_admin()
    )
  );

-- Admin acessa todos os comprovantes
CREATE POLICY "admin_select_comprovantes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comprovantes' AND is_admin());
