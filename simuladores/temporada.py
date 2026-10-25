"""Simulador de temporadas completas (especificacao/03 a 14).

Le os times dos arquivos .EFT do original (pasta ../original/equipas), sem copiar dados para o codigo.
Modela: criacao do jogo, campeonato (4 divisoes de 8 + Distrital), copa eliminatoria, eventos da partida,
escalacao/substituicao automaticas, bilheteria, salarios, juros, emprestimos, indice economico,
indice de riqueza, evolucao de forca, classificacao, acesso e descenso.
Inclui o mercado do computador (jogo/mercado.py, doc 17).
NAO modela (ainda): pedidos de aumento, penaltis durante o jogo, premio 3, treinadores.

Uso: python temporada.py [temporadas] [pais] [sinal_evolucao] [indice_inicial] [fator_2b50]
  sinal_evolucao = +1 (leitura do doc 12) ou -1 (leitura invertida)
"""
import glob, math, os, random, statistics as st, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, "..", "especificacao", "ferramentas"))
from eft_decode import ler_equipa                                   # noqa: E402
from simulador_partida import nivel_por_posicao, forca_jogador, poder_de_gol   # noqa: E402
from financas import salario, nivel_estadio, capacidade, preco_bilhete, atualiza_indice, juros, limite_emprestimo  # noqa: E402
from calendario import turno_e_returno, base_divisao, fases_copa    # noqa: E402
import mercado                                                      # noqa: E402

FORMACAO = (1, 4, 4, 2)
PREMIO1, PREMIO2, Q = 3_000_000, 1_000_000, 100_000          # tabela de moedas, Escudos (doc 15)
TABELA = turno_e_returno(8)


# ---------------------------------------------------------------- dados
class Jogador:
    __slots__ = ("nome", "pos", "nac", "f", "t", "h", "g", "estrela", "papel", "c", "susp", "les", "sal", "gols")

    def __init__(self, nome, pos, nac, f):
        self.nome, self.pos, self.nac, self.f = nome, pos, nac, f
        soma = sum(nome.encode("cp1252", "replace"))                  # doc 04 / 10
        t = round(5 - math.trunc(math.sqrt(soma % 36)))
        self.t = (t + 2) % 6 if pos == 1 else t
        self.h = soma % 10 + 1
        self.g = soma % 11
        self.estrela = 1 if (self.h >= 8 and pos >= 2) else 0
        self.papel = 0; self.c = 0; self.susp = 0; self.les = 0; self.sal = 0; self.gols = 0


class Time:
    def __init__(self, eft, L):
        self.nome, self.pais, self.L = eft["nome_curto"], eft["pais"], L
        self.jog = []
        self.estadio = nivel_estadio(L)
        self.caixa = L * 50000                                         # doc 08 (s = 1)
        self.divida = 0
        self.X = 1.0                                                   # indice de riqueza (doc 11)
        self.fator = 1.0                                               # +0x5b (doc 03/11)
        self.zera_tabela()

    def zera_tabela(self):
        self.pts = self.v = self.e = self.d = self.gp = self.gc = 0

    def media_forca(self):
        return round(sum(j.f for j in self.jog) / len(self.jog))

    def folha(self):
        return sum(j.sal for j in self.jog)


# ---------------------------------------------------------------- criacao do jogo (doc 05)
def criar_jogo(pais, rng):
    eqs = [ler_equipa(p) for p in sorted(glob.glob(os.path.join(AQUI, "..", "original", "equipas", "*.[Ee][Ff][Tt]")))]
    eqs = [e for e in eqs if e["pais"] == pais]
    rng.shuffle(eqs)                                                   # desempate entre forcas iguais
    eqs.sort(key=lambda e: -e["forca"])
    times = []
    for i, e in enumerate(eqs):
        L = nivel_por_posicao(i)
        t = Time(e, L)
        for j in e["jogadores"]:
            t.jog.append(Jogador(j["nome"], j["posicao"], j["nacionalidade"], forca_jogador(L, rng)))
        times.append(t)
    divisoes = [times[8 * d: 8 * d + 8] for d in range(4)] + [times[32:]]
    return times, divisoes


# ---------------------------------------------------------------- partida
def escalar(t):
    """doc 14: melhores por posicao, sem lesionados/suspensos; banco ate 5; trocas = min(banco, 3)."""
    for j in t.jog:
        j.papel = 0
    aptos = sorted((j for j in t.jog if j.les == 0 and j.susp == 0), key=lambda j: -j.f)
    for pos, q in enumerate(FORMACAO):
        for j in [x for x in aptos if x.pos == pos][:q]:
            j.papel = 1
    falta = 11 - sum(1 for j in t.jog if j.papel == 1)                 # completa com quem sobrar
    for j in [x for x in aptos if x.papel == 0 and x.pos > 0][:falta]:
        j.papel = 1
    banco = [x for x in aptos if x.papel == 0][:5]
    for j in banco:
        j.papel = 2
    t.trocas = min(len(banco), 3)


def setores(t):
    s = [0, 0, 0, 0]
    for j in t.jog:
        if j.papel == 1:
            s[j.pos] += 3 * (j.nac == t.pais) + j.f + 2 * j.estrela      # doc 03
    t.GK, t.DEF, t.MID, t.ATT = s
    return t


def ponderado(t, peso, rng):
    tit = [j for j in t.jog if j.papel == 1]
    tot = sum(peso(j) for j in tit)
    if tot <= 0:
        return None
    r = rng.randrange(tot); acc = 0
    for j in tit:
        acc += peso(j)
        if acc > r:
            return j


def substituir(t, sai, modo):
    if t.trocas <= 0:
        return
    gk = sai.pos == 0
    if modo == 0:
        entra = next((j for j in t.jog if j.papel == 2 and (j.pos == 0) == gk), None)
    else:
        if not gk:
            return
        entra = next((j for j in t.jog if j.papel == 2 and j.pos == 0), None)
        if entra:
            sai = next((j for j in reversed(t.jog[1:]) if j.papel == 1), None)
    if entra and sai:
        sai.papel, entra.papel = 0, 1
        t.trocas -= 1


def jogar(A, B, rng, est):
    for t in (A, B):
        escalar(t); setores(t); t.g_jogo = 0; t.anul = 0; t.fator = 1.0
    x = (2 + rng.randrange(11), rng.randrange(11))                     # arbitro (doc 11), aproximado
    for m in range(1, 91):
        ultimo = None
        for lado, (t, o) in enumerate(((A, B), (B, A))):
            G = poder_de_gol(t.__dict__, o.__dict__)
            d1, d2 = (90, 180) if lado == 0 else (120, 270)
            if ((G - (t.g_jogo + t.anul) > rng.randrange(d1)) or rng.randrange(d2) == 0) and m > rng.randrange(45):
                art = ponderado(t, lambda j: j.pos ** 2 * j.f * j.h, rng)
                t.g_jogo += 1; ultimo = (t, art)
                if art:
                    art.gols += 1
                break
        mudou = False
        for lado, t in enumerate((A, B)):                               # expulsao (aa11)
            r = rng.randrange(1000)
            if r < 10 and r > x[lado]:
                j = ponderado(t, lambda j: j.t, rng)
                if j and j.t > 0:
                    j.papel = 0; j.susp = rng.randrange(4) + 1; est["expulsoes"] += 1
                    substituir(t, j, 1); mudou = True
        r = rng.randrange(500)                                         # lesao (ac72)
        if r < 2:
            t = (A, B)[r]
            j = ponderado(t, lambda j: j.g, rng)
            if j and j.g > 0:
                j.papel = 0; j.les = rng.randrange(rng.randrange(20) or 1) + 1; j.f = max(j.f - 10, 1)
                est["lesoes"] += 1; substituir(t, j, 0); mudou = True
        if mudou:
            setores(A); setores(B)
        if ultimo:                                                     # gol anulado (aea7)
            r = rng.randrange(200)
            if r < 10 and r > x[0]:
                t, art = ultimo
                t.g_jogo -= 1; t.anul += 1
                if art:
                    art.gols -= 1
        for t in (A, B):                                               # contador +0x0c (doc 07)
            j = t.jog[rng.randrange(len(t.jog))]
            j.c += -1 if j.papel == 1 else 1
    return A.g_jogo, B.g_jogo


def publico(A, B, copa, rng):
    base = (3 * A.media_forca() + B.media_forca() + 3 * rng.random()) * math.sqrt(A.fator) * math.sqrt(B.fator) * 200
    return min(round(base ** 1.04 * (1 + 0.3 * copa)), capacidade(A.estadio))


def pos_jogo(t, est):
    for j in t.jog:                                                    # cumpre suspensao/lesao
        if j.susp: j.susp -= 1
        if j.les: j.les -= 1
    t.caixa -= t.folha(); est["salarios"] += t.folha()
    t.caixa -= juros(t.divida)


# ---------------------------------------------------------------- financas do computador (doc 09)
def gerir(t, m):
    lim = limite_emprestimo(t.media_forca(), t.fator, 1, m, Q)
    while t.divida > 0 and t.caixa - t.folha() - juros(t.divida) > 0:
        pago = min(t.divida, t.caixa - t.folha() - juros(t.divida))
        t.divida -= pago; t.caixa -= pago
    while t.caixa < t.folha() + juros(t.divida) and t.divida < lim:
        v = min(lim - t.divida, max(t.folha(), 1)); t.divida += v; t.caixa += v
    if t.caixa < 0:                                                    # 6a08: corta salarios, zera caixa [?]
        t.caixa = 0; t.falencias = getattr(t, "falencias", 0) + 1; t.fal_temp = getattr(t, "fal_temp", 0) + 1


# ---------------------------------------------------------------- temporada
def temporada(times, divisoes, rng, m, n_temp, sinal, est, p2b50=0.0):
    for t in times:
        t.zera_tabela()
    ordem = [list(d) for d in divisoes[:4]]                            # indice na tabela = posicao inicial
    ref_caixa = [sum(t.caixa for t in d) or 1 for d in divisoes[:4]]
    vivos = list(times); rng.shuffle(vivos)
    for rodada in range(1, 15):
        for d, div in enumerate(ordem):
            F = round(st.mean(t.media_forca() for t in div)); X = st.mean(t.X for t in div)
            preco = preco_bilhete(F, X, 1, m)
            for casa, fora in TABELA[rodada - 1]:
                A, B = div[casa], div[fora]
                a, b = jogar(A, B, rng, est)
                est["jogos"] += 1; est["gols"] += a + b; est["vit_casa"] += a > b; est["empates"] += a == b
                A.caixa += round(publico(A, B, False, rng) * preco)
                for t, gp, gc in ((A, a, b), (B, b, a)):
                    t.gp += gp; t.gc += gc
                    if gp > gc: t.v += 1; t.pts += 3
                    elif gp == gc: t.e += 1; t.pts += 1
                    else: t.d += 1
                    pos_jogo(t, est)
                for t in (A, B):
                    mercado.decidir_venda(t, times, m, rodada, rng, p2b50, est)
        if rodada % 2 == 0 and len(vivos) > 1 and len(times) > 2 ** ((14 - rodada) // 2):    # copa (doc 13)
            n = len(vivos); p = 1
            while p < n / 2: p *= 2
            rng.shuffle(vivos); jogam, folga = vivos[:2 * (n - p)], vivos[2 * (n - p):]
            F = round(st.mean(t.media_forca() for t in jogam)); preco = preco_bilhete(F, st.mean(t.X for t in jogam), 1, m, True)
            seguem = []
            for k in range(0, len(jogam), 2):
                A, B = jogam[k], jogam[k + 1]
                a, b = jogar(A, B, rng, est)
                renda = round(publico(A, B, True, rng) * preco / 2); A.caixa += renda; B.caixa += renda
                if a == b:                                             # penaltis automaticos (doc 14)
                    fa, fb = A.media_forca(), B.media_forca()
                    sa = sum(rng.randrange(fa) for _ in range(3)); sb = sum(rng.randrange(fb) for _ in range(3))
                    seguem.append(A if sa >= sb else B)
                else:
                    seguem.append(A if a > b else B)
                pos_jogo(A, est); pos_jogo(B, est)
                for t in (A, B):
                    mercado.decidir_venda(t, times, m, rodada, rng, p2b50, est)
            vivos = seguem + folga
        for d, div in enumerate(divisoes):                             # classificacao, evolucao (doc 12/13)
            if d < 4:
                div.sort(key=lambda t: (t.pts, t.gp - t.gc, t.gp), reverse=True)
                T = max(sum(t.caixa for t in div) / ref_caixa[d], 0.1)
            for i, t in enumerate(div):
                if d < 4:
                    t.X = 0.9 * t.X + 0.1 * T
                ref = base_divisao(d) - 2 * i                          # Distrital tambem evolui (1010:0d9c percorre as 5)
                for j in t.jog:
                    c = sinal * j.c
                    if c > 0 and (j.pos != 0 or rng.randrange(2) == 0):
                        if j.f < 50 and j.f + 1 <= min(ref + 5, 50): j.f += 1
                    elif c < 0 and rng.randrange(2) == 0:
                        if j.f > 1 and j.f - 1 >= max(ref - 5, 1): j.f -= 1
        m = atualiza_indice(m, n_temp, rng)
        for t in times:
            for j in t.jog:
                j.sal = salario(j.f, t.X, 1, m)
            gerir(t, m)
    campeao = divisoes[0][0]
    campeao.caixa += PREMIO1                                           # doc 15: premios (s = 1, Escudos)
    if len(vivos) == 1:
        est["copa"] = vivos[0].nome; vivos[0].caixa += PREMIO2
    # acesso e descenso (doc 13)
    for d in range(3):
        cima, baixo = divisoes[d], divisoes[d + 1]
        desce, sobe = cima[6:8], baixo[0:2]
        divisoes[d] = cima[:6] + sobe; divisoes[d + 1] = baixo[2:] + desce
    dist = divisoes[4]
    sobe = rng.sample(dist, 2) if len(dist) >= 2 else []
    desce = divisoes[3][6:8]
    divisoes[3] = divisoes[3][:6] + sobe
    divisoes[4] = [t for t in dist if t not in sobe] + desce
    return campeao, m


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    pais = sys.argv[2] if len(sys.argv) > 2 else "POR"
    sinal = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    m0 = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0           # doc 17: DS:0x2b46 sem inicializacao -> 0
    p2b50 = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0        # doc 17: DS:0x2b50 sem inicializacao -> 0
    rng = random.Random(42)
    times, divisoes = criar_jogo(pais, rng)
    m = m0
    for t in times:                                                    # salarios iniciais (1020:39c3)
        for j in t.jog:
            j.sal = salario(j.f, t.X, 1, m)
    print(f"{pais}: {len(times)} times; sinal da evolucao = {sinal:+d}; indice inicial {m0}; fator 2b50 {p2b50}")
    print(f"{'temp':>4} {'gols/j':>6} {'casa%':>6} {'emp%':>5} {'F1a':>5} {'F2a':>5} {'F3a':>5} {'F4a':>5} {'Fdis':>5} "
          f"{'caixa med':>10} {'divida med':>10} {'indice':>6} {'transf':>6}  campeao / taca")
    for k in range(n):
        est = dict(jogos=0, gols=0, vit_casa=0, empates=0, expulsoes=0, lesoes=0, salarios=0, copa="-", transferencias=0, valor_transf=0)
        campeao, m = temporada(times, divisoes, rng, m, k, sinal, est, p2b50)
        Fd = [st.mean(j.f for t in d for j in t.jog) for d in divisoes]
        print(f"{k + 1:>4} {est['gols'] / est['jogos']:>6.2f} {est['vit_casa'] / est['jogos']:>6.1%} {est['empates'] / est['jogos']:>5.1%} "
              + " ".join(f"{x:>5.1f}" for x in Fd)
              + f" {st.median(t.caixa for t in times):>10.0f} {st.median(t.divida for t in times):>10.0f} {m:>6.2f} {est['transferencias']:>6}  {campeao.nome} / {est['copa']}")
    print("falencias por divisao final (rodadas com caixa zerado, todas as temporadas):",
          [sum(getattr(t, "falencias", 0) for t in d) for d in divisoes])
    print("caixa mediano por divisao final:", [round(st.median(t.caixa for t in d)) for d in divisoes])
    print("receita x folha (ultima rodada) por divisao: folha media", [round(st.mean(t.folha() for t in d)) for d in divisoes])
    fal = sum(getattr(t, "falencias", 0) for t in times)
    print(f"rodadas com caixa zerado (falencia) somadas: {fal}; expulsoes/jogo e lesoes/jogo na ultima temporada: "
          f"{est['expulsoes'] / est['jogos']:.2f} / {est['lesoes'] / est['jogos']:.2f}")


if __name__ == "__main__":
    main()
