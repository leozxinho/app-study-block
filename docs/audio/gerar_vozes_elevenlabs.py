#!/usr/bin/env python3
"""
Gera os MP3 de TODAS as falas do MineLearn com UMA voz da ElevenLabs
("MineLearn – Narradora", criada no Voice Design).

Na raiz do projeto:
  export ELEVENLABS_API_KEY="sua-chave"      # ElevenLabs > Configurações > API Keys
  python3 scripts/gerar_vozes_elevenlabs.py docs/audio/falas-voz-suave.csv --teste
  python3 scripts/gerar_vozes_elevenlabs.py docs/audio/falas-voz-suave.csv --secao 7.1 --limite 2000
  python3 scripts/gerar_vozes_elevenlabs.py docs/audio/falas-voz-suave.csv --limite 30000

Opções:
  --voz NOME        nome da voz na sua conta (padrão: "MineLearn – Narradora")
  --modelo ID       eleven_multilingual_v2 (padrão, 1 crédito/caractere)
                    eleven_flash_v2_5      (0,5 crédito/caractere, menos expressivo)
  --teste           só 8 falas variadas em public/audio/_teste/ (~250 créditos)
  --secao TEXTO     só linhas cuja "secao" começa com TEXTO (7.1, 7.6, 7.8...)
  --faixa NOME      só perguntas dessa faixa (bercario, maternal, pre-escola-1...)
  --limite N        para ANTES de passar de N créditos nesta rodada
  --simular         não gera nada: só mostra quantas falas e créditos seriam usados
  --refazer         gera de novo mesmo se o arquivo já existe
  --sem-ffmpeg      não normaliza o volume

O ritmo de cada fala vem da coluna "velocidade" do CSV (berçário mais devagar).
Os arquivos que já existem são pulados: dá para gerar por lotes ao longo do mês.
Depois de cada lote: npm run audio
"""
import argparse, csv, json, os, shutil, subprocess, sys, time, urllib.request, urllib.error

p = argparse.ArgumentParser()
p.add_argument("csv")
p.add_argument("--voz", default="MineLearn – Narradora")
p.add_argument("--voz-chefes", default="MineLearn – Chefão",
               help='voz das falas dos chefes (voz "C-chefes"); use "" para usar a narradora')
p.add_argument("--modelo", default="eleven_multilingual_v2")
p.add_argument("--saida", default="public/audio")
p.add_argument("--secao"); p.add_argument("--faixa")
p.add_argument("--limite", type=int)
p.add_argument("--teste", action="store_true")
p.add_argument("--simular", action="store_true")
p.add_argument("--refazer", action="store_true")
p.add_argument("--sem-ffmpeg", action="store_true")
a = p.parse_args()

CUSTO = 0.5 if ("flash" in a.modelo or "turbo" in a.modelo) else 1.0
API = "https://api.elevenlabs.io"
KEY = os.environ.get("ELEVENLABS_API_KEY")
if not KEY and not a.simular:
    sys.exit("Defina ELEVENLABS_API_KEY (ElevenLabs > Configurações > API Keys).")

def chamar(metodo, caminho, corpo=None):
    req = urllib.request.Request(API + caminho, method=metodo,
        data=json.dumps(corpo).encode() if corpo is not None else None,
        headers={"xi-api-key": KEY or "", "Content-Type": "application/json", "Accept": "*/*"})
    for tentativa in range(5):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read(), dict(r.headers)
        except urllib.error.HTTPError as e:
            msg = e.read()[:400].decode("utf-8", "replace")
            if e.code in (429, 500, 502, 503) and tentativa < 4:
                time.sleep(3 * (tentativa + 1)); continue
            sys.exit(f"Erro {e.code} da ElevenLabs: {msg}")

# ---- quais falas ----
rows = list(csv.DictReader(open(a.csv, encoding="utf-8-sig"), delimiter=";"))
if a.secao: rows = [r for r in rows if r["secao"].startswith(a.secao)]
if a.faixa: rows = [r for r in rows if a.faixa in r["faixas"]]
if a.teste:
    want = ["mascote/acerto-01", "mascote/erro-05", "q-0010", "q-0105", "q-0205",
            "q-0311", "q-0346", "chefes/01/apresenta"]
    rows = [r for r in rows if any(w in r["arquivo"] for w in want)]

def destino(r):
    arq = ("_teste/" + r["arquivo"].replace("/", "_")) if a.teste else r["arquivo"]
    return os.path.join(a.saida, arq)

pendentes = [r for r in rows if a.refazer or not os.path.exists(destino(r))]
estimado = sum(len(r["texto_para_voz"]) for r in pendentes) * CUSTO
print(f"{len(pendentes)} fala(s) a gerar, ~{estimado:,.0f} créditos ({a.modelo}).")
if a.simular: sys.exit(0)

# ---- voz e saldo ----
dados, _ = chamar("GET", "/v1/voices")
vozes = {v["name"].strip(): v["voice_id"] for v in json.loads(dados)["voices"]}
if a.voz not in vozes:
    sys.exit(f'Voz "{a.voz}" não encontrada. Vozes na conta: {", ".join(sorted(vozes))}')
VOICE_ID = vozes[a.voz]
CHEFE_ID = VOICE_ID
if a.voz_chefes and any(r["voz"].startswith("C") for r in pendentes):
    if a.voz_chefes not in vozes:
        sys.exit(f'Voz dos chefes "{a.voz_chefes}" não encontrada. Vozes na conta: {", ".join(sorted(vozes))}')
    CHEFE_ID = vozes[a.voz_chefes]
    print(f'Chefes com a voz "{a.voz_chefes}" ({CHEFE_ID}).')
dados, _ = chamar("GET", "/v1/user/subscription")
sub = json.loads(dados)
saldo = sub.get("character_limit", 0) - sub.get("character_count", 0)
print(f'Voz "{a.voz}" ({VOICE_ID}). Saldo da conta: {saldo:,} créditos.')
teto = min(saldo, a.limite) if a.limite else saldo

FFMPEG = None if a.sem_ffmpeg else shutil.which("ffmpeg")
gasto, feitos = 0.0, 0
for r in pendentes:
    texto = r["texto_para_voz"]
    custo = len(texto) * CUSTO
    if gasto + custo > teto:
        print(f"Parei antes de passar do limite ({teto:,} créditos)."); break
    vel = r.get("velocidade", "0%").replace("%", "")
    speed = max(0.7, min(1.2, 1 + float(vel or 0) / 100))      # API aceita 0,7–1,2
    chefe = r["voz"].startswith("C")
    estilo = 0.5 if chefe else (0.35 if r["voz"].startswith("B") else 0.15)  # chefe teatral, mascote animada
    corpo = {"text": texto, "model_id": a.modelo,
             "voice_settings": {"stability": 0.4 if chefe else 0.55, "similarity_boost": 0.8,
                                "style": estilo, "use_speaker_boost": True, "speed": speed}}
    vid = CHEFE_ID if chefe else VOICE_ID
    audio, cab = chamar("POST", f"/v1/text-to-speech/{vid}?output_format=mp3_44100_128", corpo)
    out = destino(r); os.makedirs(os.path.dirname(out), exist_ok=True)
    real = cab.get("character-cost") or cab.get("x-character-count")
    gasto += float(real) if real else custo
    if FFMPEG:
        bruto = os.path.join("audio-masters", r["arquivo"])
        os.makedirs(os.path.dirname(bruto), exist_ok=True)
        open(bruto, "wb").write(audio)                     # original guardado fora do site
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", bruto,
                        "-af", "silenceremove=start_periods=1:start_threshold=-50dB,loudnorm=I=-16:TP=-1:LRA=7",
                        "-ac", "1", "-ar", "44100", "-b:a", "128k", out], check=True)
    else:
        open(out, "wb").write(audio)
    feitos += 1
    print(f"[{feitos}] {r['arquivo']}  ({gasto:,.0f} créditos)  {texto}")
    time.sleep(0.2)
print(f"Pronto: {feitos} arquivo(s), ~{gasto:,.0f} créditos nesta rodada. Rode: npm run audio")
