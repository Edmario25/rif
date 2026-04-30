import json, subprocess

N8N_URL = "https://rifan8n.apicesystem.shop"
N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkMDFkOTc5Ny00MjFjLTRkZjEtOTg2OS1iMzc3OGJlMWY0ZDQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiODNlZjYzNjgtNDc4NC00Njg2LTg0YTAtYWZkZGVkZDdhMjY1IiwiaWF0IjoxNzc3NTAwMjgyfQ.Rq-4mHioWl5Gq8zRujaVq6-V01_Y_8Dg4k2N2WV7xBg"
HDR = ["-H", f"X-N8N-API-KEY: {N8N_KEY}", "-H", "Content-Type: application/json"]

def get_wf(wf_id):
    r = subprocess.run(["curl", "-s", f"{N8N_URL}/api/v1/workflows/{wf_id}"] + HDR,
                       capture_output=True, timeout=15)
    return json.loads(r.stdout.decode("utf-8"))

def put_wf(wf_id, wf):
    body = {k: wf[k] for k in ["name", "nodes", "connections", "settings"] if k in wf}
    r = subprocess.run(["curl", "-s", "-X", "PUT", f"{N8N_URL}/api/v1/workflows/{wf_id}"] + HDR
                       + ["-d", json.dumps(body, ensure_ascii=False).encode("utf-8")],
                       capture_output=True, timeout=15)
    out = r.stdout.decode("utf-8") if r.stdout else ""
    resp = json.loads(out) if out.strip() else {}
    return resp.get("id") is not None

# JS code strings — all read from .body first (n8n webhook v2 nests POST body in .body)
otp_js = (
    "const b = items[0].json.body || items[0].json;\n"
    "const { whatsapp, codigo } = b;\n"
    "return [{ json: {\n"
    "  number: whatsapp,\n"
    "  text: '\U0001f510 *Rifa ECC* — Código de verificação:\\n\\n*' + codigo + '*\\n\\n_Válido por 10 minutos. Não compartilhe este código._'\n"
    "}}];"
)

conf_js = (
    "const b = items[0].json.body || items[0].json;\n"
    "const { whatsapp, nome, numero, rifa, conta_premiada } = b;\n"
    "let text;\n"
    "if (conta_premiada) {\n"
    "  text = '⭐ *Pagamento confirmado!*\\n\\nOlá ' + nome + '! Seu bilhete *#' + numero + '* da rifa *' + rifa + '* foi confirmado.\\n\\n\U0001f31f *CONTA PREMIADA!* Você concorre a um prêmio especial! \U0001f389\\n\\nBoa sorte! \U0001f340';\n"
    "} else {\n"
    "  text = '✅ *Pagamento confirmado!*\\n\\nOlá ' + nome + '! Seu bilhete *#' + numero + '* da rifa *' + rifa + '* foi confirmado com sucesso.\\n\\nBoa sorte no sorteio! \U0001f340';\n"
    "}\n"
    "return [{ json: { number: whatsapp, text } }];"
)

camp_js = (
    "const b = items[0].json.body || items[0].json;\n"
    "const { campanha_id, mensagem, destinatarios } = b;\n"
    "return destinatarios.map(d => {\n"
    "  const text = mensagem\n"
    "    .replace(/\\{\\{nome\\}\\}/g, d.nome || '')\n"
    "    .replace(/\\{\\{numeros\\}\\}/g, (d.numeros || []).join(', '))\n"
    "    .replace(/\\{\\{rifa\\}\\}/g, d.rifa || '')\n"
    "    .replace(/\\{\\{data_sorteio\\}\\}/g, d.data_sorteio || '');\n"
    "  return { json: { number: d.whatsapp, text, campanha_id } };\n"
    "});"
)

win_js = (
    "const b = items[0].json.body || items[0].json;\n"
    "const { whatsapp, nome, premio, numero, rifa } = b;\n"
    "const text = '\U0001f389 *Parabéns, ' + nome + '!*\\n\\nVocê foi contemplado na rifa *' + rifa + '*!\\n\\n\U0001f3c6 Prêmio: *' + premio + '*\\n\U0001f39f️ Bilhete: *#' + numero + '*\\n\\n_Nossa equipe entrará em contato em breve para a entrega do prêmio._ \U0001f64f';\n"
    "return [{ json: { number: whatsapp, text } }];"
)

fixes = {
    "VjU3dxu6d06tIWeG": {"Montar Mensagem OTP": otp_js},
    "56MtNCJeJe3MzxNo": {"Montar Mensagem": conf_js},
    "cIAaMUIbBd9Zvrtt": {"Preparar Destinatarios": camp_js},
    "T1D4kyMS7oLUF5rF": {"Montar Parabens": win_js},
}

for wf_id, node_fixes in fixes.items():
    wf = get_wf(wf_id)
    for node in wf.get("nodes", []):
        if node["name"] in node_fixes:
            node["parameters"]["jsCode"] = node_fixes[node["name"]]
            print(f"  Corrigido: {node['name']}")
    ok = put_wf(wf_id, wf)
    print(f"{'OK' if ok else 'ERRO'} -> workflow {wf_id} ({wf.get('name')})\n")
