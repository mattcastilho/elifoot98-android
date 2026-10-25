# 13 - Calendario: campeonato, copa, classificacao e acesso/descenso

Inferido do assembly; NAO validado.

## 1. Estrutura
- 5 divisoes: "1a Divisao" ... "4a Divisao" (8 times cada) e "Distrital" (o restante; e onde caem os times de nivel L = 1 do doc 05, posicao global >= 32). A Distrital NAO joga campeonato (1020:0002 so gera tabela para d < 4).
- Temporada = 14 rodadas (DS:0x2b40 = 1..14). DS:0x2b42 = contador de TEMPORADAS (incrementado no fim da temporada, 1020:038e).

## 2. Tabela do campeonato
- Cada time recebe no inicio da temporada uma linha de 14 bytes (time +0x22..+0x2f) de uma matriz fixa 8x14 (DS:0x17c8), escolhida pela posicao do time na lista da divisao.
- Na rodada r, a lista e ordenada pelo byte da rodada; posicoes (1,2), (3,4), (5,6), (7,8) se enfrentam; o primeiro do par e mandante.
- Propriedades conferidas da matriz original: turno e returno completos (28 pares, cada um 2x), returno = turno com mando invertido (rodada r+7 espelha a r), 7 jogos em casa por time.
  O jogo novo usa um gerador proprio com as mesmas propriedades (jogo/calendario.py), sem copiar a matriz.

## 3. Pontuacao e classificacao (1050:1ab6)
Vitoria 3, empate 1 (1010:9396). Campos do time: +0x16 V, +0x18 E, +0x1a D, +0x1c gols pro, +0x1e gols contra, +0x20 pontos.
Ordem: pontos, depois saldo, depois gols pro (desc). Reordenada a cada rodada (1028:0378).

## 4. Copa ("TACA - <fase>", 1020:0ed4)
- So nas rodadas pares (2, 4, ..., 14).
- A fase so ocorre se o total de times do jogo > 2^((14 - r) DIV 2): a copa comeca na primeira rodada par que permite terminar ate a rodada 14 (final na 14).
- Participantes: todos os times (lista refeita no inicio da temporada), embaralhados a cada fase.
- Com n vivos: p = menor potencia de 2 >= n/2; jogam 2*(n - p) times (n - p jogos), os demais passam direto; restam p. Ex.: 40 -> 32 -> 16 -> 8 -> 4 -> 2 -> 1.
- Nome da fase por p: 1 FINAL, 2-3 Meias-finais, 4-7 Quartos de final, 8-15 Oitavos de final, senao "<p> avos de final".
- Jogo de copa: tipo 1 (publico +30%, bilhete x1.5, renda dividida - doc 11). Desempate de jogo empatado: nao lido.

## 5. Fim de temporada (1020:038e)
1. Grava historico (campeoes, artilheiros etc., categorias 1..10).
2. Acesso e descenso, 2 por fronteira, usando a ordem final da classificacao:
   - 1a <-> 2a: 7o e 8o da 1a descem; 1o e 2o da 2a sobem.
   - 2a <-> 3a e 3a <-> 4a: idem (7o e 8o descem, 1o e 2o sobem).
   - 4a <-> Distrital: 7o e 8o da 4a descem; sobem 2 times SORTEADOS da Distrital (distintos).
   Se o time rebaixado a Distrital e humano: aviso especial (1010:4f40, codigo 0x400) [?].
3. Contador de temporadas += 1. Nova temporada: reinicia estatisticas (+0x16..), arquiva contas (doc 11), gera tabelas.
