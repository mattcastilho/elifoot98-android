"""Mercado de transferencias dos times do computador (especificacao/17).

Venda: 1010:3aad / 1010:3e9c -> leilao 1008:3002..35f4. Compra: oferta 1010:5f77, interesse 1010:5bb1,
elegibilidade 1010:633d, utilidade (para escolher quem vender) 1010:5de1.
Valores marcados [?] sao hipoteses.
"""
import math, os, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, "..", "especificacao", "ferramentas"))
from txe_decode import ler_txe                                     # noqa: E402
from financas import preco_jogador, salario                        # noqa: E402

# DS:0x300 - cota de elenco por faixa de forca media (F DIV 10): [GK, DEF, MID, ATT, -, total]
COTA = [(3, 8, 7, 3, 0, 22), (3, 8, 7, 4, 0, 22), (3, 8, 8, 5, 0, 23),
        (4, 8, 8, 5, 0, 24), (4, 9, 8, 5, 0, 25), (4, 9, 8, 5, 0, 26)]
MAX_ELENCO, MAX_ESTRANGEIROS = 24, 5
MIN_GK, MIN_ELENCO = 2, 16                                         # [?] regra de 1010:5a6a nao lida


def carregar_grupos():
    grupos = []
    for p in ("Bosman.txe", "Plop.txe"):
        caminho = os.path.join(AQUI, "..", "original", "ctrgroup", p)
        if os.path.exists(caminho):
            grupos.append(set(x for x in ler_txe(caminho)[1:] if x))
    return grupos


GRUPOS = carregar_grupos()


def categoria(nac, pais):
    """0 nacional, 1 mesmo grupo (Bosman/PLOP), 2 estrangeiro (1058:0a2f) [?]"""
    if nac == pais:
        return 0
    if any(nac in g and pais in g for g in GRUPOS):
        return 1
    return 2


def media(t):
    return round(sum(j.f for j in t.jog) / len(t.jog))


def faixa(t):
    return min(media(t) // 10, 5)


def conta_pos(t, pos):
    return sum(1 for j in t.jog if j.pos == pos)


def estrangeiros(t):
    return sum(1 for j in t.jog if categoria(j.nac, t.pais) == 2)


def utilidade(t, j):
    """1010:5de1 - menor valor = jogador menos util para o time."""
    av = media(t); fx = faixa(t)
    u = (5 / (j.t + 1)) ** 0.25
    u *= COTA[fx][j.pos] / (conta_pos(t, j.pos) + 1)
    u *= COTA[fx][5] / (len(t.jog) + 1)
    u *= j.f / (av + 1)
    c = categoria(j.nac, t.pais)
    return u * (1.5 if c == 0 else 1.2 if c == 1 else 1.0)


def pode_sair(t, j):
    if j.pos == 0 and conta_pos(t, 0) <= MIN_GK:
        return False
    return len(t.jog) > MIN_ELENCO


def interesse(B, j):
    """1010:5bb1"""
    av = media(B); fx = faixa(B)
    i = (j.f / (av + 5)) * (COTA[fx][j.pos] + 1) / (conta_pos(B, j.pos) + 1) * COTA[fx][5] / (len(B.jog) + 1)
    i = i ** 0.25 * max(av, 1) ** 0.1
    if j.pos == 0 and conta_pos(B, 0) == 1:
        i *= 1.5
    c = categoria(j.nac, B.pais); e = estrangeiros(B)
    k = 1.5 + 0.05 * e if c == 0 else 1.15 + 0.05 * e if c == 1 else 1.0
    if j.estrela:
        k *= 1.1
    return i * k


def elegivel(B, j):
    """1010:633d"""
    if len(B.jog) >= MAX_ELENCO:
        return False
    if estrangeiros(B) >= MAX_ESTRANGEIROS and categoria(j.nac, B.pais) == 2:
        return False
    return True


def oferta(B, j, sal, m):
    """1010:5f77"""
    if COTA[faixa(B)][j.pos] == conta_pos(B, j.pos):
        return 0
    V = preco_jogador(j.f, j.t, j.g, j.h, 1, m) * interesse(B, j)
    P = B.folha()
    R = (B.caixa - V) / (P + 1 + sal)
    if R < 3:
        V = B.caixa - 3 * (P + sal)
    elif R > 5:
        V = V * math.log(R) / 1.6
    if P > 100 and B.caixa - V > 10 * P and B.caixa - V > 1:
        V = V * (math.log((B.caixa - V) / P - 9) / 10 + 1)
    of = max(0, min(round(B.caixa - V - 5 * P), round(V)))        # [?] leitura literal
    return of // 1000 * 1000


def leilao(vendedor, j, minimo, times, m, est):
    """1008:3787 / 3563 / 35f4: melhor oferta >= minimo leva."""
    melhor, comprador = None, None
    for B in times:
        if B is vendedor or not elegivel(B, j) or B.caixa < minimo:
            continue
        sal = salario(j.f, B.X, 1, m)
        of = oferta(B, j, sal, m)
        if of >= minimo and (melhor is None or of > melhor):
            melhor, comprador = of, B
    if comprador is None:
        return False
    vendedor.jog.remove(j); comprador.jog.append(j)
    j.sal = salario(j.f, comprador.X, 1, m)
    vendedor.caixa += melhor; comprador.caixa -= melhor
    est["transferencias"] += 1; est["valor_transf"] += melhor
    return True


def decidir_venda(t, times, m, rodada, rng, p2b50, est):
    """1010:3e9c (caixa negativo) e 1010:3aad (aperto, 5% de sorteio, estrangeiros)."""
    candidatos = [j for j in t.jog if pode_sair(t, j)]
    if not candidatos:
        return
    j = min(candidatos, key=lambda x: utilidade(t, x))
    if t.caixa < 0:
        leilao(t, j, 0, times, m, est)
        return
    if rodada <= 1:
        return
    aperto = t.caixa * 3 < t.folha()
    if aperto or rng.randrange(20) == 0 or (estrangeiros(t) == MAX_ESTRANGEIROS and len(t.jog) >= 21):
        minimo = round(preco_jogador(j.f, j.t, j.g, j.h, 1, m) * 1.6 * p2b50) // 1000 * 1000
        leilao(t, j, minimo, times, m, est)
