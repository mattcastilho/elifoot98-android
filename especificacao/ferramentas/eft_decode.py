"""Leitor do formato .EFT (equipas do Elifoot 98).
Implementacao propria, baseada em ../01-formato-eft.md.
Uso: python eft_decode.py <pasta_das_equipas>   (valida todos os arquivos e mostra estatisticas)
"""
import sys, glob, os, collections

def ler_string(d, pos):
    """String cifrada: 1 byte de tamanho L + L bytes.
    Cifra: c[i] = p[i] + c[i-1] (soma acumulada, mod 256), com c[-1] = L."""
    L = d[pos]; prev = L; out = bytearray()
    for i in range(L):
        c = d[pos + 1 + i]
        out.append((c - prev) & 255)
        prev = c
    return out.decode('cp1252'), pos + 1 + L

def ler_equipa(path):
    d = open(path, 'rb').read()
    if d[:3] != b'EFa':
        raise ValueError('cabecalho invalido')
    pos = 0x32
    nome_longo, pos = ler_string(d, pos)
    nome_curto, pos = ler_string(d, pos)
    cores = list(d[pos:pos + 8]); pos += 8          # 2 cores: R,G,B,0 cada
    pais, pos = ler_string(d, pos)
    forca, n_jog, reservado = d[pos], d[pos + 1], d[pos + 2]; pos += 3
    jogadores = []
    for _ in range(n_jog):
        nac, pos = ler_string(d, pos)
        nome, pos = ler_string(d, pos)
        jogadores.append(dict(nacionalidade=nac, nome=nome, posicao=d[pos], extra=d[pos + 1]))
        pos += 2
    treinador, pos = ler_string(d, pos)
    if pos != len(d):
        raise ValueError(f'{len(d) - pos} bytes sobrando')
    return dict(arquivo=os.path.basename(path), nome_longo=nome_longo, nome_curto=nome_curto,
                cores=cores, pais=pais, forca=forca, reservado=reservado,
                jogadores=jogadores, treinador=treinador)

if __name__ == '__main__':
    pasta = sys.argv[1]
    ok = 0; stats = collections.Counter()
    for f in sorted(glob.glob(os.path.join(pasta, '*'))):
        e = ler_equipa(f); ok += 1
        stats['forca=%02d' % e['forca']] += 1
        for j in e['jogadores']:
            stats['posicao=%d' % j['posicao']] += 1
            stats['extra=%d' % j['extra']] += 1
    print('equipas lidas sem erro:', ok)
    for k in sorted(stats): print(k, stats[k])
