"""Calendario e temporada (especificacao/12 e 13). Gerador proprio (metodo do circulo), nao copia a matriz do original."""
import random

def turno_e_returno(n=8):
    """Lista de rodadas; cada rodada = lista de (mandante, visitante) por indice 0..n-1.
    Metodo do circulo no turno; returno = turno com mando invertido (cada time joga n-1 em casa)."""
    arr = list(range(n)); turno = []
    for r in range(n - 1):
        rod = []
        for k in range(n // 2):
            a, b = arr[k], arr[n - 1 - k]
            rod.append((a, b) if (r + k) % 2 == 0 else (b, a))
        turno.append(rod)
        arr = [arr[0], arr[-1]] + arr[1:-1]
    return turno + [[(b, a) for a, b in rod] for rod in turno]

def chave_classificacao(t):
    return (t["pts"], t["gp"] - t["gc"], t["gp"])

def base_divisao(d):
    return 52 - 14 * d

def evolucao(forca, contador, ref, goleiro, rng):
    """doc 12. Devolve nova forca."""
    if contador > 0 and (not goleiro or rng.randrange(2) == 0):
        if forca < 50 and forca + 1 <= min(ref + 5, 50):
            forca += 1
    elif contador < 0 and rng.randrange(2) == 0:
        if forca > 1 and forca - 1 >= max(ref - 5, 1):
            forca -= 1
    return forca

def fases_copa(n):
    """doc 13: sequencia (vivos, jogos, nome)."""
    out = []
    while n > 1:
        p = 1
        while p < n / 2: p *= 2
        nome = "FINAL" if p == 1 else "Meias-finais" if p <= 3 else "Quartos de final" if p <= 7 else "Oitavos de final" if p <= 15 else f"{p} avos de final"
        out.append((n, n - p, nome)); n = p
    return out

def rodada_inicial_copa(total_times):
    for r in range(2, 15, 2):
        if total_times > 2 ** ((14 - r) // 2):
            return r

if __name__ == "__main__":
    from collections import Counter
    cal = turno_e_returno(8); pares = Counter(frozenset(j) for r in cal for j in r)
    casa = Counter(a for r in cal for a, b in r)
    print("rodadas", len(cal), "pares", len(pares), set(pares.values()), "em casa", sorted(casa.values()))
    for n in (40, 64, 100):
        print(n, "times: copa comeca na rodada", rodada_inicial_copa(n), fases_copa(n))
