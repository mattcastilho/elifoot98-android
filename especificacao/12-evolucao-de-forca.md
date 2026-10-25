# 12 - Evolucao da forca individual (a cada rodada)

Inferido do assembly; NAO validado.

## 1. Quando
1020:0c41 (processa uma rodada) -> 1010:0d9c -> para cada divisao 1010:6fb8 -> para cada time 1010:4a41(time, ref).
Roda em TODAS as rodadas, depois dos jogos e da reordenacao da classificacao (1028:0378).

## 2. Referencia do time
- Base da divisao d (0 = 1a ... 3 = 4a, 4 = Distrital): `base = 52 - 14*d` -> 52, 38, 24, 10, -4 (1010:0b60).
- Para o time na posicao i (0 = lider) da lista da divisao: `ref = base - 2*i`.
  A lista e reordenada por classificacao a cada rodada, entao ref acompanha a posicao atual na tabela.

## 3. Regra por jogador (4a41)
Seja c = slot +0x0c (contador de minutos: -1 quando sorteado em campo, +1 quando sorteado fora, doc 07) e F = forca.
- c > 0: se for goleiro, so com 50% (Random(2) = 0). Se F < 50: F += 1; se F > ref + 5 (ou > 50), desfaz.
- c < 0: com 50%: se F > 1: F -= 1; se F < ref - 5 (ou < 1), desfaz.
- c = 0: nada.
Efeito: a forca de cada jogador tende a ficar dentro de [ref-5, ref+5]; quem ja esta acima da faixa so cai se c < 0.

## 4. Duvida importante
Pela leitura, jogador que mais joga (c negativo) tende a PERDER forca e reserva tende a GANHAR. Isso contraria a intuicao. Hipoteses:
(a) a leitura de +0x10 (1 = em campo) ou do sinal no doc 07 esta invertida; (b) e intencional (desgaste x treino).
Nao foi achado reset de +0x0c; parece acumular durante a carreira. **Prioridade de validacao no jogo original.**
