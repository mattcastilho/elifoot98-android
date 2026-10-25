"""Financas (especificacao/08). Valores [?] sao hipoteses. Nomes e dados proprios do novo jogo."""
import math, random

PISO, TETO = 50, 50000          # em unidades de s (escala da moeda)

def caixa_inicial(L, s=1):
    return L * 50000 * s

def nivel_estadio(L):
    """doc 11: capacidade = nivel * 5000"""
    return max(1, round(0.3 * L))

def atualiza_indice(m, temporada, rng):
    """chamada a cada rodada; temporada = contador de temporadas (doc 08/13)"""
    r1, r2, r3 = rng.random(), rng.random(), rng.random()
    m += 0.01 * (r1 + r2 - r3) if temporada % 100 < 50 else 0.01 * (r1 - r2 - r3)
    return max(min(m, 10.0), 0.5)

def salario(forca, fator_time=1.0, s=1, indice=1.0):
    v = 35 * math.sqrt(fator_time) * s * indice * forca ** 1.04 * 1000 ** 0.04
    q = round(v / (50 * s)) * 50 * s
    return min(max(q, PISO * s), TETO * s)

if __name__ == "__main__":
    for f in (1, 5, 10, 20, 30, 40, 50):
        print(f"forca {f:>2}: salario {salario(f)}")
    rng = random.Random(3); m = 1.0
    for t in range(120):
        for _ in range(14): m = atualiza_indice(m, t, rng)
        if t % 20 == 19: print(f"temporada {t+1}: indice {m:.2f}")


# --- doc 09 (hipoteses, ver especificacao/09) ---
def preco_jogador(forca, temperamento=0, agressividade=0, fator=1, s=1, indice=1.0):
    A = forca ** 1.04 * s * indice
    k = 1 - 0.2 * (temperamento / 5) - 0.2 * (agressividade / 10) + 0.2 * (fator / 10)
    return round(2000 * A * k)

def juros(divida):
    return round(0.05 * divida)

def limite_emprestimo(media_forca, fator_time=1.0, s=1, indice=1.0, q=1):
    v = int(round(media_forca * fator_time * indice * s * 20000))
    v = (v // q) * q
    return v or q


# --- doc 11 (hipoteses, ver especificacao/11) ---
def capacidade(nivel):
    return nivel * 5000

def publico(media_mand, media_vis, rng, nivel_est, fator_mand=1.0, fator_vis=1.0, copa=False):
    base = (3 * media_mand + media_vis + 3 * rng.random()) * math.sqrt(fator_mand) * math.sqrt(fator_vis) * 200
    p = round(base ** 1.04 * (1 + 0.3 * copa))
    return min(p, capacidade(nivel_est))

def preco_bilhete(media_forca, riqueza=1.0, s=1, indice=1.0, tipo1=False, unidade=1):
    X = max(riqueza, 0.1)
    p = round(s * indice / math.sqrt(X) * media_forca / 5 * (1 + 0.5 * tipo1)) / 2
    p = max(p, 0.5 * s)
    return round(p / unidade) * unidade if unidade > 1 else p

def atualiza_riqueza(X, caixa_atual_div, caixa_ref_div):
    T = max(caixa_atual_div / caixa_ref_div, 0.1)
    return 0.9 * X + 0.1 * T

def salario_pedido(salario_base, rodada, s=1):
    return round(salario_base * (rodada * 0.2 / 14 + 1) * 1.1 / 50 / s) * 50 * s
