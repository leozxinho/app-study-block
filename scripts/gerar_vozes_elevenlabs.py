#!/usr/bin/env python3
"""
Gera os MP3 das falas do MineLearn com as vozes da ElevenLabs:
narradora/mascote/pais com "MineLearn - Narradora" e os chefes com uma voz grave própria.

Chave da API (uma vez): crie o arquivo .env.local na raiz do projeto com a linha
  ELEVENLABS_API_KEY=sua-chave              # ElevenLabs > Configurações > API Keys
(o .gitignore já ignora *.local e o site não lê essa variável). Também vale "export".

Na raiz do projeto:
  python3 scripts/gerar_vozes_elevenlabs.py --listar-vozes          # vozes da sua conta
  # Rodadas extras das atividades (715 falas, ~20 mil créditos):
  python3 scripts/gerar_vozes_elevenlabs.py docs/audio/falas-rodadas.csv --teste
  python3 scripts/gerar_vozes_elevenlabs.py docs/audio/falas-rodadas.csv
  # Chefes com a voz grave (refaz os 120 arquivos; os antigos vão para audio-masters/_antigas/):
  python3 scripts/gerar_vozes_elevenlabs.py docs/audio/falas-voz-suave.csv --secao "7.7 chefe" --teste
  python3 scripts/gerar_vozes_elevenlabs.py docs/audio/falas-voz-suave.csv --secao "7.7 chefe" --refazer
  # Demais falas, por lotes:
  python3 scripts/gerar_vozes_elevenlabs.py docs/audio/falas-voz-suave.csv --secao 7.1 --limite 2000

Opções:
  --voz NOME        voz da narradora/mascote/pais (padrão: "MineLearn - Narradora")
  --voz-chefes NOME voz dos chefes (linhas com voz "C-..."), nome ou voice_id
                    (padrão: "MineLearn - Chefão"; sem ela na conta, o script avisa)
  --grave-chefes F  engrossa a voz dos chefes com o ffmpeg (1 = sem mudança;
                    0.85 = uns 3 semitons mais grave; padrão 0.85). Não muda a velocidade.
  --listar-vozes    mostra as vozes da conta (nome, gênero, idade, sotaque) e sai
  --modelo ID       eleven_multilingual_v2 (padrão, 1 crédito/caractere)
                    eleven_flash_v2_5      (0,5 crédito/caractere, menos expressivo)
  --teste           só 8 falas variadas do CSV em public/audio/_teste/ (para ouvir antes)
  --secao TEXTO     só linhas cuja "secao" começa com TEXTO (7.1, 7.6, 7.8...)
  --faixa NOME      só perguntas dessa faixa (bercario, maternal, pre-escola-1...)
  --limite N        para ANTES de passar de N créditos nesta rodada
  --simular         não gera nada: só mostra quantas falas e créditos seriam usados
  --refazer         gera de novo mesmo se o arquivo já existe (guarda o antigo em
                    audio-masters/_antigas/<data>/)
  --sem-ffmpeg      não normaliza o volume

O ritmo de cada fala vem da coluna "velocidade" do CSV (berçário mais devagar).
Os arquivos que já existem são pulados: dá para gerar por lotes ao longo do mês.
Depois de cada lote: npm run audio
"""
import argparse, csv, json, os, shutil, subprocess, sys, time, urllib.request, urllib.error

p = argparse.ArgumentParser()
p.add_argument("csv", nargs="?")
p.add_argument("--voz", default="MineLearn - Narradora")
p.add_argument("--voz-chefes", default="MineLearn - Chefão")
p.add_argument("--grave-chefes", type=float, default=0.85)
p.add_argument("--listar-vozes", action="store_true")
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
def chave_do_arquivo():
    """Lê ELEVENLABS_API_KEY do .env.local (ou .env) na raiz, sem mostrar o valor."""
    for nome in (".env.local", ".env"):
        if os.path.exists(nome):
            for linha in open(nome, encoding="utf-8"):
                k, _, v = linha.strip().partition("=")
                if k.strip() == "ELEVENLABS_API_KEY" and v.strip():
                    return v.strip().strip('"').strip("'")
    return None

KEY = os.environ.get("ELEVENLABS_API_KEY") or chave_do_arquivo()
if not KEY and not a.simular:
    sys.exit("Falta a chave: crie .env.local com ELEVENLABS_API_KEY=sua-chave (ElevenLabs > Configurações > API Keys).")
if not a.csv and not a.listar_vozes:
    p.error("informe o CSV (ex.: docs/audio/falas-rodadas.csv) ou use --listar-vozes")

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

# ---- listar vozes da conta ----
if a.listar_vozes:
    dados, _ = chamar("GET", "/v1/voices")
    print("Vozes na sua conta (para os chefes, procure gender=male, age=middle_aged/old e descrição 'deep'):")
    for v in sorted(json.loads(dados)["voices"], key=lambda v: v["name"]):
        lab = v.get("labels") or {}
        info = ", ".join(f"{k}={lab[k]}" for k in ("gender", "age", "accent", "description", "use_case") if lab.get(k))
        print(f'  {v["name"]:<32} {v["voice_id"]}  {info}')
    sys.exit(0)

# ---- quais falas ----
rows = list(csv.DictReader(open(a.csv, encoding="utf-8-sig"), delimiter=";"))
if a.secao: rows = [r for r in rows if r["secao"].startswith(a.secao)]
if a.faixa: rows = [r for r in rows if a.faixa in r["faixas"]]
if a.teste:
    want = ["mascote/acerto-01", "mascote/erro-05", "q-0010", "q-0105", "q-0205",
            "q-0311", "q-0346", "chefes/01/apresenta"]
    escolhidas = [r for r in rows if any(w in r["arquivo"] for w in want)]
    if len(escolhidas) < 8:  # outro CSV/seção (rodadas, chefes...): 8 falas espalhadas pela lista
        passo = max(1, len(rows) // 8)
        escolhidas = rows[::passo][:8]
    rows = escolhidas

def destino(r):
    arq = ("_teste/" + r["arquivo"].replace("/", "_")) if a.teste else r["arquivo"]
    return os.path.join(a.saida, arq)

pendentes = [r for r in rows if a.refazer or not os.path.exists(destino(r))]
estimado = sum(len(r["texto_para_voz"]) for r in pendentes) * CUSTO
print(f"{len(pendentes)} fala(s) a gerar, ~{estimado:,.0f} créditos ({a.modelo}).")
if a.simular: sys.exit(0)

# ---- vozes e saldo ----
dados, _ = chamar("GET", "/v1/voices")
# Nome sem diferença entre os tipos de traço (hífen, meia-risca e travessão)
traco = lambda n: n.strip().replace("\u2013", "-").replace("\u2014", "-")
vozes = {traco(v["name"]): v["voice_id"] for v in json.loads(dados)["voices"]}
ids = set(vozes.values())

def achar_voz(nome, para):
    if traco(nome) in vozes: return vozes[traco(nome)]
    if nome in ids: return nome                       # voice_id direto
    sys.exit(f'Voz "{nome}" ({para}) não encontrada. Rode --listar-vozes para ver as da conta.\n'
             f'Vozes na conta: {", ".join(sorted(vozes))}')

def eh_chefe(r): return r.get("voz", "").startswith("C")

VOICE_ID = achar_voz(a.voz, "narradora") if any(not eh_chefe(r) for r in pendentes) else None
CHEFE_ID = achar_voz(a.voz_chefes, "chefes, use --voz-chefes") if any(eh_chefe(r) for r in pendentes) else None
if CHEFE_ID: print(f'Chefes: voz "{a.voz_chefes}" ({CHEFE_ID}), engrossada x{a.grave_chefes}.')
dados, _ = chamar("GET", "/v1/user/subscription")
sub = json.loads(dados)
saldo = sub.get("character_limit", 0) - sub.get("character_count", 0)
print(f'Voz "{a.voz}" ({VOICE_ID}). Saldo da conta: {saldo:,} créditos.')
ANTIGAS = os.path.join("audio-masters", "_antigas", time.strftime("%Y-%m-%d_%H%M%S"))

def guardar_antigo(caminho, relativo):
    """Antes de regravar (--refazer), guarda o arquivo antigo em audio-masters/_antigas/."""
    if os.path.exists(caminho):
        dest = os.path.join(ANTIGAS, relativo)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(caminho, dest)
teto = min(saldo, a.limite) if a.limite else saldo

FFMPEG = None if a.sem_ffmpeg else shutil.which("ffmpeg")
gasto, feitos = 0.0, 0
for r in pendentes:
    texto = r["texto_para_voz"]
    custo = len(texto) * CUSTO
    if gasto + custo > teto:
        print(f"Parei antes de passar do limite ({teto:,} créditos)."); break
    vel = r.get("velocidade", "0%").replace("%", "")
    speed = max(0.7, min(1.2, 1 + float(vel or 0) / 100))      # API aceita 0,7-1,2
    chefe = eh_chefe(r)
    estilo = 0.55 if chefe else 0.35 if r["voz"].startswith("B") else 0.15   # chefe teatral, mascote animada
    estabilidade = 0.4 if chefe else 0.55
    corpo = {"text": texto, "model_id": a.modelo,
             "voice_settings": {"stability": estabilidade, "similarity_boost": 0.8,
                                "style": estilo, "use_speaker_boost": True, "speed": speed}}
    audio, cab = chamar("POST", f"/v1/text-to-speech/{CHEFE_ID if chefe else VOICE_ID}?output_format=mp3_44100_128", corpo)
    out = destino(r); os.makedirs(os.path.dirname(out), exist_ok=True)
    if a.refazer and not a.teste:
        guardar_antigo(out, os.path.join("public-audio", r["arquivo"]))
        guardar_antigo(os.path.join("audio-masters", r["arquivo"]), os.path.join("masters", r["arquivo"]))
    real = cab.get("character-cost") or cab.get("x-character-count")
    gasto += float(real) if real else custo
    if FFMPEG:
        bruto = os.path.join("audio-masters", r["arquivo"])
        os.makedirs(os.path.dirname(bruto), exist_ok=True)
        open(bruto, "wb").write(audio)                     # original guardado fora do site
        filtros = "silenceremove=start_periods=1:start_threshold=-50dB,loudnorm=I=-16:TP=-1:LRA=7"
        if chefe and a.grave_chefes != 1:
            filtros = f"rubberband=pitch={a.grave_chefes}:formant=preserved," + filtros   # voz mais grossa
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", bruto,
                        "-af", filtros, "-ac", "1", "-ar", "44100", "-b:a", "128k", out], check=True)
    else:
        open(out, "wb").write(audio)
    feitos += 1
    print(f"[{feitos}] {r['arquivo']}  ({gasto:,.0f} créditos)  {texto}")
    time.sleep(0.2)
print(f"Pronto: {feitos} arquivo(s), ~{gasto:,.0f} créditos nesta rodada. Rode: npm run audio")
