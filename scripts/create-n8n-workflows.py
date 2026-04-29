import json, subprocess, sys

N8N_URL = "https://rifan8n.apicesystem.shop"
N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkMDFkOTc5Ny00MjFjLTRkZjEtOTg2OS1iMzc3OGJlMWY0ZDQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiODNlZjYzNjgtNDc4NC00Njg2LTg0YTAtYWZkZGVkZDdhMjY1IiwiaWF0IjoxNzc3NTAwMjgyfQ.Rq-4mHioWl5Gq8zRujaVq6-V01_Y_8Dg4k2N2WV7xBg"
EVO_URL  = "https://rifaevolution.apicesystem.shop"
EVO_KEY  = "VsNqeUetu3fXRqqHBetQJ8VNM518KZI2"
EVO_INST = "rifa"
APP_URL  = "https://rifa.apicesystem.shop"

HEADERS = ["-H", f"X-N8N-API-KEY: {N8N_KEY}", "-H", "Content-Type: application/json"]

def api(method, path, body=None):
    cmd = ["curl", "-s", "-X", method, f"{N8N_URL}{path}"] + HEADERS
    if body:
        cmd += ["-d", json.dumps(body)]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
    return json.loads(r.stdout)

def http_node(node_id, name, url, headers_list, body_params, pos):
    return {
        "parameters": {
            "method": "POST", "url": url,
            "sendHeaders": True,
            "headerParameters": {"parameters": [{"name": k, "value": v} for k, v in headers_list]},
            "sendBody": True, "contentType": "json", "specifyBody": "keypair",
            "bodyParameters": {"parameters": [{"name": k, "value": v} for k, v in body_params]},
            "options": {}
        },
        "id": node_id, "name": name,
        "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": pos
    }

def webhook_node(node_id, name, path, response_mode, pos, webhook_uuid):
    return {
        "parameters": {"httpMethod": "POST", "path": path, "responseMode": response_mode, "options": {}},
        "id": node_id, "name": name,
        "type": "n8n-nodes-base.webhook", "typeVersion": 2,
        "position": pos, "webhookId": webhook_uuid
    }

def code_node(node_id, name, js, pos):
    return {
        "parameters": {"jsCode": js},
        "id": node_id, "name": name,
        "type": "n8n-nodes-base.code", "typeVersion": 2, "position": pos
    }

def respond_node(node_id, name, pos):
    return {
        "parameters": {"respondWith": "json", "responseBody": '={"success":true}', "options": {}},
        "id": node_id, "name": name,
        "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": pos
    }

evo_url  = f"{EVO_URL}/message/sendText/{EVO_INST}"
evo_hdrs = [("apikey", EVO_KEY)]

# ─── Workflow 1: OTP ──────────────────────────────────────────────────────────
otp_code = (
    "const { whatsapp, codigo } = items[0].json;\n"
    "return [{ json: {\n"
    "  number: whatsapp,\n"
    '  text: "\\u{1F510} *Rifa ECC* \\u2014 C\\u00f3digo de verifica\\u00e7\\u00e3o:\\n\\n*" + codigo + "*\\n\\n_V\\u00e1lido por 10 minutos. N\\u00e3o compartilhe este c\\u00f3digo._"\n'
    "}}];"
)

wf1 = {
    "name": "OTP WhatsApp",
    "nodes": [
        webhook_node("w1", "Webhook OTP", "otp", "responseNode", [240, 300], "a1b2c3d4e5f60001"),
        code_node("w2", "Montar Mensagem OTP", otp_code, [460, 300]),
        http_node("w3", "Enviar OTP", evo_url, evo_hdrs,
                  [("number", "={{ $json.number }}"), ("text", "={{ $json.text }}")], [680, 300]),
        respond_node("w4", "Responder", [900, 300]),
    ],
    "connections": {
        "Webhook OTP": {"main": [[{"node": "Montar Mensagem OTP", "type": "main", "index": 0}]]},
        "Montar Mensagem OTP": {"main": [[{"node": "Enviar OTP", "type": "main", "index": 0}]]},
        "Enviar OTP": {"main": [[{"node": "Responder", "type": "main", "index": 0}]]},
    },
    "settings": {"executionOrder": "v1"}
}

# ─── Workflow 2: Confirmação ───────────────────────────────────────────────────
conf_code = (
    "const { whatsapp, nome, numero, rifa, conta_premiada } = items[0].json;\n"
    "let text;\n"
    "if (conta_premiada) {\n"
    '  text = "\\u2B50 *Pagamento confirmado!*\\n\\nOl\\u00e1 " + nome + "! Seu bilhete *#" + numero + "* da rifa *" + rifa + "* foi confirmado.\\n\\n\\uD83C\\uDF1F *CONTA PREMIADA!* Voc\\u00ea concorre a um pr\\u00eamio especial! \\uD83C\\uDF89\\n\\nBoa sorte! \\uD83C\\uDF40";\n'
    "} else {\n"
    '  text = "\\u2705 *Pagamento confirmado!*\\n\\nOl\\u00e1 " + nome + "! Seu bilhete *#" + numero + "* da rifa *" + rifa + "* foi confirmado com sucesso.\\n\\nBoa sorte no sorteio! \\uD83C\\uDF40";\n'
    "}\n"
    "return [{ json: { number: whatsapp, text } }];"
)

wf2 = {
    "name": "Confirmacao de Pagamento",
    "nodes": [
        webhook_node("c1", "Webhook Confirmacao", "confirmacao", "responseNode", [240, 300], "b2c3d4e5f6a70002"),
        code_node("c2", "Montar Mensagem", conf_code, [460, 300]),
        http_node("c3", "Enviar Confirmacao", evo_url, evo_hdrs,
                  [("number", "={{ $json.number }}"), ("text", "={{ $json.text }}")], [680, 300]),
        respond_node("c4", "Responder", [900, 300]),
    ],
    "connections": {
        "Webhook Confirmacao": {"main": [[{"node": "Montar Mensagem", "type": "main", "index": 0}]]},
        "Montar Mensagem": {"main": [[{"node": "Enviar Confirmacao", "type": "main", "index": 0}]]},
        "Enviar Confirmacao": {"main": [[{"node": "Responder", "type": "main", "index": 0}]]},
    },
    "settings": {"executionOrder": "v1"}
}

# ─── Workflow 3: Campanha ─────────────────────────────────────────────────────
camp_code = (
    "const { campanha_id, mensagem, destinatarios } = items[0].json;\n"
    "return destinatarios.map(d => {\n"
    "  const text = mensagem\n"
    "    .replace(/\\{\\{nome\\}\\}/g, d.nome || '')\n"
    "    .replace(/\\{\\{numeros\\}\\}/g, (d.numeros || []).join(', '))\n"
    "    .replace(/\\{\\{rifa\\}\\}/g, d.rifa || '')\n"
    "    .replace(/\\{\\{data_sorteio\\}\\}/g, d.data_sorteio || '');\n"
    "  return { json: { number: d.whatsapp, text, campanha_id } };\n"
    "});"
)

agg_code = (
    "const campanha_id = items[0]?.json?.campanha_id || '';\n"
    "return [{ json: {\n"
    "  tipo: 'campanha_concluida',\n"
    "  campanha_id,\n"
    "  total_enviados: items.length,\n"
    "  total_erros: 0\n"
    "}}];"
)

callback_url = f"{APP_URL}/api/webhooks/n8n"
wf3 = {
    "name": "Campanha WhatsApp",
    "nodes": [
        webhook_node("p1", "Webhook Campanha", "campanha", "onReceived", [240, 300], "c3d4e5f6a7b80003"),
        code_node("p2", "Preparar Destinatarios", camp_code, [460, 300]),
        http_node("p3", "Enviar Mensagem", evo_url, evo_hdrs,
                  [("number", "={{ $json.number }}"), ("text", "={{ $json.text }}")], [680, 300]),
        code_node("p4", "Agregar Resultados", agg_code, [900, 300]),
        http_node("p5", "Callback App", callback_url,
                  [("Content-Type", "application/json"), ("X-API-Key", "PREENCHER_N8N_API_KEY_DO_APP")],
                  [("tipo", "={{ $json.tipo }}"),
                   ("campanha_id", "={{ $json.campanha_id }}"),
                   ("total_enviados", "={{ $json.total_enviados }}"),
                   ("total_erros", "={{ $json.total_erros }}")],
                  [1120, 300]),
    ],
    "connections": {
        "Webhook Campanha": {"main": [[{"node": "Preparar Destinatarios", "type": "main", "index": 0}]]},
        "Preparar Destinatarios": {"main": [[{"node": "Enviar Mensagem", "type": "main", "index": 0}]]},
        "Enviar Mensagem": {"main": [[{"node": "Agregar Resultados", "type": "main", "index": 0}]]},
        "Agregar Resultados": {"main": [[{"node": "Callback App", "type": "main", "index": 0}]]},
    },
    "settings": {"executionOrder": "v1"}
}

# ─── Workflow 4: Ganhador ─────────────────────────────────────────────────────
win_code = (
    "const { whatsapp, nome, premio, numero, rifa } = items[0].json;\n"
    'const text = "\\uD83C\\uDF89 *Parab\\u00e9ns, " + nome + "!*\\n\\nVoc\\u00ea foi contemplado na rifa *" + rifa + "*!\\n\\n\\uD83C\\uDFC6 Pr\\u00eamio: *" + premio + "*\\n\\uD83C\\uDF9F\\uFE0F Bilhete: *#" + numero + "*\\n\\n_Nossa equipe entrar\\u00e1 em contato em breve para a entrega do pr\\u00eamio._ \\uD83D\\uDE4F";\n'
    "return [{ json: { number: whatsapp, text } }];"
)

wf4 = {
    "name": "Notificacao Ganhador",
    "nodes": [
        webhook_node("g1", "Webhook Ganhador", "ganhador", "responseNode", [240, 300], "d4e5f6a7b8c90004"),
        code_node("g2", "Montar Parabens", win_code, [460, 300]),
        http_node("g3", "Enviar Parabens", evo_url, evo_hdrs,
                  [("number", "={{ $json.number }}"), ("text", "={{ $json.text }}")], [680, 300]),
        respond_node("g4", "Responder", [900, 300]),
    ],
    "connections": {
        "Webhook Ganhador": {"main": [[{"node": "Montar Parabens", "type": "main", "index": 0}]]},
        "Montar Parabens": {"main": [[{"node": "Enviar Parabens", "type": "main", "index": 0}]]},
        "Enviar Parabens": {"main": [[{"node": "Responder", "type": "main", "index": 0}]]},
    },
    "settings": {"executionOrder": "v1"}
}

# ─── Criar e ativar ───────────────────────────────────────────────────────────
paths = {"OTP WhatsApp": "otp", "Confirmacao de Pagamento": "confirmacao",
         "Campanha WhatsApp": "campanha", "Notificacao Ganhador": "ganhador"}

for wf in [wf1, wf2, wf3, wf4]:
    r = api("POST", "/api/v1/workflows", wf)
    wf_id = r.get("id")
    if not wf_id:
        print(f"ERRO ao criar '{wf['name']}': {json.dumps(r, indent=2)}")
        sys.exit(1)
    act = api("POST", f"/api/v1/workflows/{wf_id}/activate")
    path = paths.get(wf["name"], "?")
    print(f"OK  {wf['name']}")
    print(f"    ID      : {wf_id}")
    print(f"    Ativo   : {act.get('active', False)}")
    print(f"    Webhook : {N8N_URL}/webhook/{path}")
    print()
