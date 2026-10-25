# 19 - Moral do time, carreira do treinador, obras no estadio e moedas

Inferido do assembly; NAO validado. Implementado em jogo/web/motor.js.

## 1. Moral do time (time +0x5b, real48; inicial 1.0)
Atualizada depois de CADA jogo (1010:9396 via 1068:10d1): `moral = 0.85*moral + 0.15*alvo`.
| resultado | mandante | visitante |
|---|---|---|
| vitoria do mandante | 2.0 | 0.0 |
| empate | 0.8 | 1.3 |
| vitoria do visitante | 0.0 | 2.0 |
Efeitos ja documentados: poder de gol x (moral/2)^(1/4) (doc 03), publico x raiz(moral) dos dois times (doc 11), limite de emprestimo x moral (doc 09).
Ate esta versao o simulador mantinha a moral fixa em 1.0.

## 2. Carreira do treinador
- Demissao (1010:8b5d): treinador com 10 jogos ou mais no clube e moral do time < 0.65. Humano tambem perde o emprego se o clube cai para a Distrital (1010:576f).
- Troca (1010:4f40): o clube recebe novo treinador; a moral do clube (e do clube que o recebe) volta a 1.0; o historico registra demissao e contratacao.
- Novo emprego (1010:5343): monta uma lista de clubes candidatos e ordena; o criterio exato nao foi lido.
  Aproximacao no jogo novo: ate 3 clubes da mesma divisao ou abaixo (sem a Distrital), com forca media ate 3 pontos acima, priorizando os de moral mais baixa.
- Opcao do jogo (DS:0x2b34): demissoes ligadas/desligadas (no jogo novo: caixa "Treinadores podem ser demitidos").

## 3. Obras no estadio (objeto estadio, time +0x12)
- byte +4 = nivel (1..24), capacidade = 5000*nivel; real48 +5 = ocupacao media.
- Ocupacao (1010:c0c0, a cada jogo em casa): `ocup = 0.7*ocup + 0.3*publico/(capacidade+1)`; comeca em 0.
- Pode ampliar (c030) se ocup >= 0.8 e nivel < 24. Ampliar (c081): nivel + 1, ocup = 0.6.
- Custo (c172 + 1040:37ee): k = 1 (nivel < 6), 2 (< 14), 3 (resto); `Max(Round(raiz(k) * indice * 35000 * s / 50000) * 50000, 50000)`.
- Computador amplia (1010:3aad) quando pode e caixa > 2*folha + custo. Lancado na conta 0x17 ("obras").

## 4. Moedas
Tabela do doc 15 escolhivel no jogo novo ("Com que moeda vai querer jogar?"): escala s, unidade do emprestimo q, premios e arredondamento do bilhete (multiplo de 2 em Euros/Dolares/Reais).

## 5. Preco do bilhete do humano
O campo "textTicketPrice" e apenas exibicao; nao foi encontrado codigo em que o humano altere o preco. O preco segue a formula do doc 11 para todos.

## 6. Partida interativa (jogo novo)
O motor agora avanca um minuto por vez em todos os jogos da rodada (campeonato e depois Taca, em duas fases), o que permite pausar e fazer ate 3 substituicoes manuais (o original permitia substituir durante o jogo). Pausa automatica no intervalo.
