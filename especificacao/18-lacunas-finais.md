# 18 - Lacunas finais: renegociacao de salarios, penaltis na partida, treinadores, premios

Inferido do assembly; NAO validado.

## 1. Renegociacao de salarios (1010:3e9c, depois de cada jogo, rodada > 1)
Para cada jogador ainda nao renegociado na temporada (slot +0x16 = 0), r = salario recalculado (7ff4) / salario atual.
- Time do computador (ou humano sem negociacao manual para a categoria do jogador):
  - o jogador de MENOR r, se r < 1.2, passa ao salario recalculado;
  - o jogador de MAIOR r, se r > 0.8, passa ao salario recalculado;
  - ambos ficam marcados (+0x16 = 1) ate o fim da temporada. => os salarios se ajustam aos poucos, ~2 por jogo.
- Time humano com negociacao manual: o jogador de maior r com r > 1.3 e aumento > 300 pede aumento (dialogo 66dc, valor do doc 11 secao 8).
  Se recusado, vai a leilao com preco minimo 0 (doc 17).
- O simulador antigo recalculava todos os salarios a cada rodada; o jogo novo segue esta regra.

## 2. Penaltis durante a partida (1010:a6eb)
- Mandante: penalti se Random(6000) < x_casa; visitante: se Random(7000) < x_fora (x do arbitro, doc 11; x_casa = 2 + v).
  => ~0,1 penalti por jogo. ATENCAO: aqui x alto da MAIS penaltis ao lado; em expulsao, lesao e gol anulado (r < 10 e r > x) x alto da MENOS.
- Batedor: o melhor do time por um comparador (1010:67c1 / 1050:1f88) [?] usado: maior valor do doc 03.
- Cobranca (1010:81ed): a = Random(valor do batedor), b = Random(forca do goleiro);
  com 25% de chance (Random(4) = 0) e a < 13: erro - a < 4 fora, < 10 por cima, < 12 barra, < 13 poste;
  senao gol se a >= b, defesa se a < b.
- Ha tambem repeticao de penalti ligada ao evento do minuto anterior (Random(3)) [nao modelado].

## 3. Treinadores (TCoach, TCoachEvent, TcoachManagerDlg)
Camada de carreira do humano: contrato, ofertas ("Contratado pelo ..."), demissao, historico, ranking de treinadores.
Nenhum termo de treinador foi encontrado no motor da partida (doc 03): para o computador, o treinador e so um nome do .EFT.

## 4. Premios de fim de temporada (1020:304c -> 2bf6)
Premio 1 (Escudos: 3 000 000) -> campeao da 1a divisao (lista da divisao 0, posicao 0).
Premio 2 (1 000 000) -> vencedor da Taca (lista da copa, posicao 0).
Premio 3 (500 000) -> destinatario nao identificado.
