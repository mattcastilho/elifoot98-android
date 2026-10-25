"""Simulador de partida - implementacao propria baseada em especificacao/03 e 05.
Equipas e jogadores sao ficticios (gerados). Nao usa nenhum dado do original.

Parametros ainda desconhecidos (ver especificacao): propensao a penalti e o campo +0x59 -> aqui 0.
"""
import math, random, sys, statistics as st

ESQUEMA = (1, 4, 4, 2)          # goleiro, defesa, meio, ataque (4-4-2)
SETORES = ("GK", "DEF", "MID", "ATT")

def nivel_por_posicao(i):
    """doc 05, secao 4"""
    if i <= 32:
        return max(round(50 * (1 - i / 32)) - 1, 5)
    return 1

def forca_jogador(L, rng):
    return min(max(L + 3 - rng.randrange(7), 1), 50)

def criar_equipa(posicao, rng, nome=None, bonus_nome=0):
    """Cria 11 titulares. valor = 3 (jogador nacional) + forca + 2*bonus_nome (doc 03, secao 2)."""
    L = nivel_por_posicao(posicao)
    setores = [0, 0, 0, 0]
    for pos, qtd in enumerate(ESQUEMA):
        for _ in range(qtd):
            setores[pos] += 3 + forca_jogador(L, rng) + 2 * bonus_nome
    return dict(nome=nome or f"Equipa {posicao + 1}", L=L, GK=setores[0], DEF=setores[1], MID=setores[2], ATT=setores[3],
                fator=1.0, extra59=0)

def poder_de_gol(A, B):
    """doc 03, secao 3, passos 1 a 5. Devolve G."""
    S = 0.0
    pares = ((A["DEF"], B["ATT"], 1), (A["MID"], B["MID"], 2), (A["ATT"], 3 * B["GK"] + B["DEF"], 1))
    for sa, sb, peso in pares:
        a, b = 1 + sa, 1 + sb
        S += peso * a / (a + b + 1)
    P = 4 * (A["ATT"] + A["MID"] / 2)
    D = 3 * B["GK"] + B["DEF"] + B["MID"] / 2 + 1
    Q = 1 + P / D
    return S * math.log(Q) * (A["fator"] / 2) ** 0.25

def tentativa_gol(G, gols, lado, minuto, rng, extra59=0):
    """doc 03, secao 3, passo 6."""
    d1, d2 = (90, 180) if lado == 0 else (120, 270)
    ok = (G - (gols + extra59) > rng.randrange(d1)) or rng.randrange(d2) == 0
    return ok and minuto > rng.randrange(45)

def jogar(casa, fora, rng):
    gc = gf = 0
    Gc0, Gf0 = poder_de_gol(casa, fora), poder_de_gol(fora, casa)
    for m in range(1, 91):
        # no original: so uma equipa marca por minuto (a segunda so e tentada se a primeira nao marcou)
        if tentativa_gol(Gc0, gc, 0, m, rng, casa["extra59"]):
            gc += 1
        elif tentativa_gol(Gf0, gf, 1, m, rng, fora["extra59"]):
            gf += 1
    return gc, gf

def confronto(pos_casa, pos_fora, n, seed=1):
    rng = random.Random(seed)
    v = e = d = 0
    gols_c, gols_f = [], []
    for _ in range(n):
        casa, fora = criar_equipa(pos_casa, rng), criar_equipa(pos_fora, rng)
        a, b = jogar(casa, fora, rng)
        gols_c.append(a); gols_f.append(b)
        if a > b: v += 1
        elif a == b: e += 1
        else: d += 1
    return v / n, e / n, d / n, st.mean(gols_c), st.mean(gols_f)

if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    print(f"{n} jogos por confronto. 'pos' = posicao na lista global (0 = mais forte). Mandante primeiro.")
    print(f"{'casa':>5} {'fora':>5} {'vit.casa':>9} {'empate':>7} {'vit.fora':>9} {'gols casa':>10} {'gols fora':>10}")
    for pc, pf in [(0, 0), (8, 8), (16, 16), (0, 8), (8, 0), (0, 16), (0, 24), (0, 33), (8, 16), (16, 24), (24, 33), (33, 33), (33, 0)]:
        v, e, d, gc, gf = confronto(pc, pf, n)
        print(f"{pc:>5} {pf:>5} {v:>9.1%} {e:>7.1%} {d:>9.1%} {gc:>10.2f} {gf:>10.2f}")
