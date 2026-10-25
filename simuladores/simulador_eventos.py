"""Simulador de partida com eventos (especificacao/03, 05, 07, 11, 14). Equipes ficticias.
Inclui: artilheiro ponderado, lesao (+ substituicao), expulsao (+ troca de goleiro), gol anulado.
Nao modelados: penaltis no jogo, fadiga/evolucao. Arbitro: x_casa = 2 + v, x_fora = v (doc 11)."""
import random, sys, statistics as st
from simulador_partida import nivel_por_posicao, forca_jogador, poder_de_gol, ESQUEMA

RESERVAS = (1, 2, 2, 2)      # goleiro, defesa, meio, ataque no banco
TROCAS = 3                   # [?] valor inicial de +0x4d nao confirmado

def novo_jogador(pos, L, rng, papel):
    return dict(pos=pos, f=forca_jogador(L, rng), t=rng.choice((0,0,0,1,1,2,2,3,3,4,5)),
                g=rng.randrange(11), h=rng.randrange(10) + 1, papel=papel)   # papel: 1 campo, 2 banco, 0 fora

def criar_equipe(posicao, rng):
    L = nivel_por_posicao(posicao)
    jog = [novo_jogador(p, L, rng, 1) for p, q in enumerate(ESQUEMA) for _ in range(q)]
    jog += [novo_jogador(p, L, rng, 2) for p, q in enumerate(RESERVAS) for _ in range(q)]
    return dict(jog=jog, fator=1.0, extra59=0, gols=0, trocas=TROCAS, lesoes=0, expulsoes=0, marcadores=[])

def setores(t):
    s = [0, 0, 0, 0]
    for j in t["jog"]:
        if j["papel"] == 1:
            s[j["pos"]] += 3 + j["f"]
    t.update(GK=s[0], DEF=s[1], MID=s[2], ATT=s[3])

def sorteio_ponderado(t, peso, rng):
    tit = [j for j in t["jog"] if j["papel"] == 1]
    tot = sum(peso(j) for j in tit)
    if tot <= 0:
        return None
    r = rng.randrange(tot); acc = 0
    for j in tit:
        acc += peso(j)
        if acc > r:
            return j

def substituir(t, sai, modo):
    """doc 14 (1010:67f7). modo 0: entra reserva da mesma classe; modo 1: so se sai o goleiro."""
    if t["trocas"] <= 0:
        return
    eh_gk = sai["pos"] == 0
    if modo == 0:
        entra = next((j for j in t["jog"] if j["papel"] == 2 and (j["pos"] == 0) == eh_gk), None)
    else:
        if not eh_gk:
            return
        entra = next((j for j in t["jog"] if j["papel"] == 2 and j["pos"] == 0), None)
        if entra:
            sai = next((j for j in reversed(t["jog"][1:]) if j["papel"] == 1), None)   # sai o ultimo de linha em campo
    if entra and sai:
        sai["papel"] = 0; entra["papel"] = 1; t["trocas"] -= 1

def jogar(casa, fora, rng, v_arbitro=(0, 0)):
    x = (2 + v_arbitro[0], v_arbitro[1])
    for t in (casa, fora): setores(t)
    for m in range(1, 91):
        G = (poder_de_gol(casa, fora), poder_de_gol(fora, casa)); ultimo = None
        for lado, t in enumerate((casa, fora)):
            d1, d2 = (90, 180) if lado == 0 else (120, 270)
            if ((G[lado] - (t["gols"] + t["extra59"]) > rng.randrange(d1)) or rng.randrange(d2) == 0) and m > rng.randrange(45):
                art = sorteio_ponderado(t, lambda j: j["pos"] ** 2 * j["f"] * j["h"], rng)
                t["gols"] += 1; t["marcadores"].append(art["pos"] if art else None); ultimo = t
                break
        # expulsao (aa11): r < 10 e r > x do lado
        for lado, t in enumerate((casa, fora)):
            r = rng.randrange(1000)
            if r < 10 and r > x[lado]:
                j = sorteio_ponderado(t, lambda j: j["t"], rng)
                if j and j["t"] > 0:
                    j["papel"] = 0; t["expulsoes"] += 1; substituir(t, j, 1)
        # lesao (ac72)
        r = rng.randrange(500)
        if r in (0, 1):
            t = (casa, fora)[r]
            j = sorteio_ponderado(t, lambda j: j["g"], rng)
            if j and j["g"] > 0:
                j["papel"] = 0; j["f"] = max(j["f"] - 10, 1); t["lesoes"] += 1; substituir(t, j, 0)
        for t in (casa, fora): setores(t)
        # gol anulado (aea7)
        if ultimo is not None:
            r = rng.randrange(200)
            if r < 10 and r > x[0]:
                ultimo["gols"] -= 1; ultimo["extra59"] += 1
    return casa["gols"], fora["gols"]

if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    rng = random.Random(7)
    print(f"{n} jogos. Arbitro v ~ Random(11) por lado.")
    print(f"{'casa':>5}{'fora':>5}{'V':>8}{'E':>8}{'D':>8}{'gc':>7}{'gf':>7}{'les/j':>8}{'exp/j':>8}{'anul/j':>8}")
    for pc, pf in [(0, 0), (0, 7), (8, 15), (24, 31), (0, 8), (16, 16)]:
        v = e = d = 0; gc = []; gf = []; les = []; ex = []; an = []
        for _ in range(n):
            c, f = criar_equipe(pc, rng), criar_equipe(pf, rng)
            a, b = jogar(c, f, rng, (rng.randrange(11), rng.randrange(11)))
            gc.append(a); gf.append(b); les.append(c["lesoes"] + f["lesoes"]); ex.append(c["expulsoes"] + f["expulsoes"]); an.append(c["extra59"] + f["extra59"])
            v += a > b; e += a == b; d += a < b
        print(f"{pc:>5}{pf:>5}{v/n:>8.1%}{e/n:>8.1%}{d/n:>8.1%}{st.mean(gc):>7.2f}{st.mean(gf):>7.2f}{st.mean(les):>8.2f}{st.mean(ex):>8.2f}{st.mean(an):>8.2f}")
