# 07 - Eventos do minuto: expulsao, gol anulado, fadiga e escolha do artilheiro

Fonte: assembly exportado (Ghidra). Tudo abaixo e INFERIDO da leitura do codigo, nao validado no jogo original.
Ordem do tick de minuto (1048:069b): a6eb (gol/penalti) -> aa11 (lesao) -> ac72 (expulsao) -> aea7 (gol anulado) -> afff (fadiga).

## 1. Sorteio ponderado 1010:100b(lista, modo, filtro)
Soma os pesos de todos os jogadores da lista, sorteia r = Random(soma) e devolve o primeiro jogador cujo acumulado passa de r.
Com filtro = 1, so entram os titulares (slot +0x10 == 1). Peso por modo (1010:0f2e):

| modo | peso | uso |
|---|---|---|
| 1 | forca individual (+0x0a) | nao visto |
| 2 | posicao^2 * forca * fator(+0x2b) | **artilheiro** (44a1). Goleiro (pos 0) nunca marca; DEF x1, MEI x4, ATA x9 |
| 3 | +0x2d (temperamento t, 0-5) | **expulsao** (48be, via aa11) |
| 4 | +0x2f (fragilidade g = soma MOD 11, 0..10; g = 0 nunca se lesiona) | **lesao** (4940, via ac72) |

## 2. CORRECAO (doc 14): ac72 + 4940 e LESAO, aa11 + 48be e EXPULSAO
Confirmado pelas mensagens da tela 1018:229f: +0x27 = "Suspenso por N jogos" (gravado por 48be) e +0x29 = "Lesionado por N jogos" (gravado por 4940).

### 2a. Lesao (ac72 + 4940)
- Por minuto: r = Random(500). r = 0 -> time A, r = 1 -> time B, outro valor -> nada (~0,36 lesoes por jogo).
- Sorteia titular no modo 4 (peso = fragilidade g). Se g > 0:
  - +0x10 = 0 (sai de campo), +0x1f (contador de lesoes, long) += 1;
  - afastamento +0x29 = Random(Random(20)) + 1 jogos (1 a 19, concentrado nos valores baixos);
  - forca +0x0a = Max(forca - 10, 1) [?] (permanente pela leitura; verificar se e restaurada ao voltar).
- Time do computador: substituicao modo 0 (doc 14). Depois recalcula setores (397d).

### 2b. Expulsao (aa11 + 48be) - doc 04 secao 3
- r = Random(1000); evento se r < 10 e r > +0x4c (A) / +0x4e (B) -> chance (9 - x)/1000 por minuto, 0 se x >= 9 (x vem do arbitro, doc 11).
- Sorteia titular no modo 3 (peso = temperamento t); se t > 0: sai de campo, suspensao +0x27 = Random(4) + 1, contador +0x23 += 1.
- Time do computador: substituicao modo 1 (so se o expulso for o goleiro, doc 14).

## 3. Gol anulado (aea7)
- So se a lista de eventos da partida (+0x44) nao estiver vazia. r = Random(200). Se r < 10 e r > campo +0x4c da partida (provavelmente atributo do arbitro; 0 se desconhecido), ou seja chance (9 - x4c)/200 = 4,5% com x4c = 0.
- Atua apenas sobre o ULTIMO evento da lista, se for do minuto corrente, tipo 1 (gol) e ainda nao anulado.
- Efeito: time.+0x59 += 1 ; time.+0x4f (gols) -= 1 ; estatistica de gols do artilheiro -1 ; evento passa a tipo 6 (anulado).
- **Resolve o campo +0x59 do doc 03**: e o numero de gols ANULADOS da partida. Na formula G - (gols + campo59), gols cai 1 e campo59 sobe 1, entao um gol anulado continua a contar contra a propensao do time a marcar.

## 4. Fadiga (afff + 49e2)
- Por minuto e por time (se byte da partida +0x2d != 2): sorteia 1 jogador qualquer da lista (Random(contagem)); se esta em campo (+0x10 == 1) seu campo +0x0c diminui 1, senao aumenta 1.
- Leitura: +0x0c e energia/condicao; titulares gastam, reservas recuperam. Onde +0x0c entra no calculo de forca ainda NAO foi encontrado.

## 5. Pendencias
- Valor e origem de +0x4c/+0x4e da partida (arbitro? REFEREE.TXE nao decodificado).
- Substituicoes: ver doc 14.
