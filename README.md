# Elifoot 98 — recriação para celular

Recriação do **Elifoot 98** (André Elias, 1998) para celular, na vertical. As regras foram reconstruídas por engenharia reversa
em "sala limpa": primeiro documentadas a partir do executável original (pasta `especificacao/`), depois reimplementadas do zero
(`web/motor.js`). Várias regras foram conferidas lendo a memória do jogo original rodando num emulador (doc 21).

Este repositório **não contém nada do jogo original**: nem o executável, nem times, jogadores, árbitros, bandeiras ou
a desmontagem do código. Sem esses arquivos o jogo usa uma liga fictícia; quem tiver o Elifoot 98 pode importar os
`.EFT` pelo próprio jogo ou gerar uma versão local com os dados da sua cópia (veja abaixo).

## O que tem no jogo
- Telas do original adaptadas para a vertical: painel do clube com elenco, menus Elifoot / Selecionar / Time / Jogador /
  Campeonato / Treinador, abas Jogo / Jogador / Finanças / Seleção / Adversário.
- Rodada com as 4 divisões jogando ao mesmo tempo (público, placar, último lance, relógio), intervalo com substituições,
  lesões, pênaltis, cartões, gols anulados.
- Copa como rodada própria, com sorteio e disputa de pênaltis cobrança a cobrança.
- Leilões de jogadores entre as rodadas, venda de jogadores, renovação de contrato, pedidos de aumento.
- Finanças (4 moedas, índice econômico, salários, ingressos, prêmios, juros), estádio e obras, moral, demissão de técnicos.
- Ligas de vários países (34 a 128 times), 4 divisões de 8 + Distrital, acesso e descenso, até 6 treinadores humanos.
- Histórico, artilheiros, últimos vencedores, ranking de treinadores, opções e perfil do original.

## Estrutura
| Pasta | Conteúdo |
|---|---|
| `especificacao/` | Regras do original (docs 00–21) e ferramentas de leitura dos formatos (`.EFT`, `.TXE`, NE) |
| `web/` | O jogo: `motor.js` (regras), `dados.js` (liga fictícia e leitor de `.EFT`), `app.html` (interface) |
| `android/` | `gerar_apk.py`: monta um APK (WebView em tela cheia, retrato) sem precisar do Android SDK |
| `simuladores/` | Primeiros simuladores em Python usados para testar a especificação |
| `testes/` | Teste do motor (Node) e da interface no tamanho de um celular (Playwright) |

## Como jogar
```bash
cd web
python montar.py          # gera web/elifoot.html
```
Abra `web/elifoot.html` no navegador do computador ou do celular. O jogo salva sozinho no navegador.

### Com os times da sua cópia do Elifoot 98 (uso pessoal)
```bash
cd web
python extrair_originais.py "caminho/da/pasta/do/Elifoot 98"   # lê EQUIPAS, REFEREE.TXE, COUNTRY.TXE e FLAGS (Pillow p/ bandeiras)
python montar.py --original                                     # gera elifoot-local.html e elifoot-apk.html
```
Esses arquivos ficam fora do Git (`.gitignore`) e não devem ser publicados.

## APK para Android
```bash
keytool -genkeypair -keystore chave.jks -alias elifoot -keyalg RSA -keysize 2048 -validity 10000
python android/gerar_apk.py web/elifoot-apk.html sem-assinatura.apk   # ou web/elifoot.html (liga fictícia)
cp sem-assinatura.apk ElifootNovo.apk
jarsigner -keystore chave.jks -sigalg SHA256withRSA -digestalg SHA-256 ElifootNovo.apk elifoot
```
O script escreve à mão o `classes.dex` e o `AndroidManifest.xml` binário; o APK tem assinatura v1 e `targetSdk 29`
(instala do Android 5 ao 15; o Play Protect avisa que o app foi feito para uma versão antiga). Guarde a chave: as
atualizações precisam da mesma chave para instalar por cima sem perder o jogo salvo.

## Testes
```bash
node testes/motor.test.js
cd web && python montar.py && cd .. && node testes/interface.test.js   # precisa do Playwright
```

## Situação
Validado no original: níveis e força inicial dos times, caixa, índice econômico, salários, atributos pelo nome, evolução de
força, lesões, calendário, fórmula das ofertas do mercado e regras de leilão (doc 21). Ainda em aberto: lance do humano no
leilão, critério dos clubes que oferecem emprego após demissão, pontuação do ranking de treinadores, repetição de pênalti
e final da copa em campo neutro (hipóteses marcadas com [?] na especificação).

## Aviso
Elifoot é uma marca e obra de André Elias. Este é um projeto de fã, sem fins lucrativos e sem ligação com o autor.
Nenhum arquivo, imagem ou dado do jogo original está incluído aqui.
