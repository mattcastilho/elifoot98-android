"""Le a SUA copia do Elifoot 98 e gera os dados usados pela versao local/APK (uso pessoal, nao publicar):
dados_originais.json (pasta EQUIPAS/*.EFT), arbitros_originais.json (REFEREE.TXE),
paises.json (COUNTRY.TXE) e bandeiras.json (pasta FLAGS/*.BMP, precisa do Pillow: pip install pillow).

    python extrair_originais.py "C:/Jogos/Elifoot 98"
"""
import base64, glob, io, json, os, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', 'especificacao', 'ferramentas'))
from eft_decode import ler_equipa      # noqa: E402
from txe_decode import ler_txe         # noqa: E402

def achar(pasta, nome):
    for n in os.listdir(pasta):
        if n.lower() == nome.lower():
            return os.path.join(pasta, n)
    return None

def main(raiz):
    eq = achar(raiz, 'equipas')
    if not eq:
        sys.exit('Nao achei a pasta EQUIPAS dentro de ' + raiz)
    times = []
    for p in sorted(glob.glob(os.path.join(eq, '*.[Ee][Ff][Tt]'))):
        e = ler_equipa(p); c = e['cores']
        times.append({'n': e['nome_longo'], 'c': e['nome_curto'], 'p': e['pais'], 'f': e['forca'],
                      'cor': [c[0], c[1], c[2], c[4], c[5], c[6]], 'tr': e['treinador'],
                      'j': [[j['nome'], j['posicao'], j['nacionalidade']] for j in e['jogadores']]})
    json.dump(times, open(os.path.join(AQUI, 'dados_originais.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print(len(times), 'times')
    ref = achar(raiz, 'REFEREE.TXE')
    if ref:
        arb = [[l[:3], l[4:]] for l in ler_txe(ref)[1:] if len(l) > 4]
        json.dump(arb, open(os.path.join(AQUI, 'arbitros_originais.json'), 'w', encoding='utf-8'), ensure_ascii=False)
        print(len(arb), 'arbitros')
    cou = achar(raiz, 'COUNTRY.TXE')
    if cou:
        nomes = {l[:3]: l[4:] for l in ler_txe(cou)[1:] if len(l) > 4}
        json.dump(nomes, open(os.path.join(AQUI, 'paises.json'), 'w', encoding='utf-8'), ensure_ascii=False)
        print(len(nomes), 'paises')
    fl = achar(raiz, 'flags')
    if fl:
        try:
            from PIL import Image
        except ImportError:
            print('Pillow nao instalado: bandeiras ignoradas'); return
        band = {}
        for p in sorted(glob.glob(os.path.join(fl, '*.[Bb][Mm][Pp]'))):
            b = io.BytesIO(); Image.open(p).convert('RGB').save(b, 'PNG', optimize=True)
            band[os.path.splitext(os.path.basename(p))[0].upper()] = base64.b64encode(b.getvalue()).decode()
        json.dump(band, open(os.path.join(AQUI, 'bandeiras.json'), 'w'), separators=(',', ':'))
        print(len(band), 'bandeiras')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
