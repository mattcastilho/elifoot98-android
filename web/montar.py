"""Monta as versoes jogaveis a partir de app.html + motor.js + dados.js.

    python montar.py                 -> elifoot.html (liga ficticia; importa .EFT pelo navegador)
    python montar.py --original      -> tambem elifoot-local.html e elifoot-apk.html, com os times, arbitros,
                                        bandeiras e nomes de paises do SEU Elifoot 98 (gerados por extrair_originais.py).
                                        Esses arquivos sao so para uso pessoal: nao publique.
"""
import json, os, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
ler = lambda n: open(os.path.join(AQUI, n), encoding='utf-8').read()
js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
opc = lambda n: json.load(open(os.path.join(AQUI, n), encoding='utf-8')) if os.path.exists(os.path.join(AQUI, n)) else None

base = ler('app.html').replace('/*MOTOR*/', ler('motor.js').replace('</script', '<\\/script')).replace('/*DADOS*/', ler('dados.js').replace('</script', '<\\/script'))
nomes = opc('paises.json') or {}
open(os.path.join(AQUI, 'elifoot.html'), 'w', encoding='utf-8').write(
    base.replace('/*DADOS_ORIGINAIS*/', '').replace('/*BANDEIRAS*/', 'const NOMES_PAISES_TXE = ' + js(nomes) + ';'))
print('elifoot.html')

if '--original' in sys.argv:
    orig, arb, band = opc('dados_originais.json'), opc('arbitros_originais.json') or [], opc('bandeiras.json') or {}
    if not orig:
        sys.exit('Falta dados_originais.json: rode antes  python extrair_originais.py <pasta do Elifoot 98>')
    local = base.replace('/*DADOS_ORIGINAIS*/', 'const DADOS_ORIGINAIS = ' + js(orig) + ';\nconst DADOS_ARBITROS = ' + js(arb) + ';')
    local = local.replace('/*BANDEIRAS*/', 'const BANDEIRAS = ' + js(band) + ';\nconst NOMES_PAISES_TXE = ' + js(nomes) + ';')
    open(os.path.join(AQUI, 'elifoot-local.html'), 'w', encoding='utf-8').write(local)
    open(os.path.join(AQUI, 'elifoot-apk.html'), 'w', encoding='utf-8').write('<!doctype html>\n<html lang="pt-BR"><meta charset="utf-8">\n' + local)
    print('elifoot-local.html, elifoot-apk.html (uso pessoal)')
