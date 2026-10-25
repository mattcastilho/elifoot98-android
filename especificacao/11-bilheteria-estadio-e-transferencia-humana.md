# 11 - Bilheteria, estadio, indice de riqueza, livro-caixa e transferencia do humano

Inferido do assembly; NAO validado. s = escala da moeda, m = indice economico (doc 08).

## 1. Livro-caixa (1010:58bf(time, valor, categoria))
Soma `valor` ao caixa (+0x71) e acumula numa conta da temporada (dwords a partir de time +0x31):
| cat. | conta | uso visto |
|---|---|---|
| 1 | +0x31 | receita de bilheteria (9396) |
| 2 | +0x35 | venda de jogador (1008:3a10) |
| 3 | +0x39 | premios (1020:2bf6, valores em DS:0x2d8f.. - nao lidos) |
| 0x15 | +0x3d | compra de jogador (valor negativo) |
| 0x16 | +0x41 | salarios (5a0a paga a folha) |
| 0x17 | +0x45 | estadio/obras [?] (c172, usado em 3aad e 1030:3036) |
| 0x18 | +0x49 | juros [?] (5a37 paga 5% da divida) |

## 2. Estadio (time +0x12) - CORRECAO do doc 05
O objeto em time +0x12 e o ESTADIO, nao o treinador. Byte +4 = nivel do estadio, inicial `Max(1, Round(0.3*L))`.
Capacidade = `nivel * 5000` (1010:bf35). Um real em estadio +5 guarda a ocupacao media (atualizada em c0c0 com peso 0.7 [?]).

## 3. Indice de riqueza da divisao (time +0x79) - CORRECAO do doc 08
- divisao +0x1f = soma do caixa de todos os times da divisao no momento de referencia (1010:7067).
- A cada rodada (1010:6e48): `T = soma do caixa atual dos times da divisao nao controlados por humano / divisao.+0x1f`, `T = Max(T, 0.1)`;
  para cada time da divisao: `X = 0.9*X + 0.1*T` (1068:115e). Inicial 1.0.
- X entra no salario (proporcional a raiz de X, doc 08) e no preco do bilhete (inversamente proporcional a raiz de X).

## 4. Publico (1010:b0a1)
Partida tipo 2 (amistoso [?]) ou sem dois times -> publico 0. Senao:
```
base = (3*media_forca(mandante) + media_forca(visitante) + 3*Random) * Sqrt(mand.+0x5b) * Sqrt(vis.+0x5b) * 200
publico = Round( base^1.04 * (1 + 0.3*[tipo == 1]) )
publico = Min(publico, capacidade do estadio do mandante)
```
+0x5b = fator real48 do time (inicial 1.0; o mesmo do doc 03, possivelmente moral/popularidade).
Exemplo: medias 30 e 30, fatores 1 -> ~36 mil; estadio nivel 3 limita a 15 mil.

## 5. Preco do bilhete (1040:35e1), em jogos criados por 1010:0875
X = media de +0x79 dos participantes, F = media de forca dos participantes, tipo da competicao k:
```
X = Max(X, 0.1)
p = Round( s*m/Sqrt(X) * F/5 * (1 + 0.5*[k == 1]) ) / 2
p = Max(p, 0.5*s); se unidade u = DS:0x2d9b > 1: p = Round(p/u)*u
```
Exemplo s = m = X = 1, F = 30 -> 3.

## 6. Receita (1010:9396)
- Tipo 0 (campeonato): mandante recebe `Round(publico * preco)` (categoria 1).
- Outros tipos: cada time recebe `Round(publico * preco * ... / 2)` (renda dividida).

## 7. Arbitro (+0x48 da partida) e campos +0x4c/+0x4e - resolve pendencia dos docs 03/07
+0x48 = arbitro sorteado da lista DS:0x2706 (REFEREE.TXE). `+0x4c = c95c(arbitro, mandante) + 2`, `+0x4e = c95c(arbitro, visitante)`.
`c95c`: soma, posicao a posicao (do fim ao inicio, ate o maior comprimento), das diferencas entre os caracteres de uma string do arbitro e do nome do time; v = |soma MOD 11|; +3 se outra string do arbitro for igual a uma do time (provavelmente o pais) [?].
Faixa ~0..13. Valor maior = menos lesoes, penaltis e gols anulados a favor/contra daquele lado (ver docs 03, 04, 07).

## 8. Transferencia (1008:3a10) e salario pedido (1010:66dc)
- Execucao: define o novo salario do jogador (8156), tira-o do vendedor (383c), poe-no no comprador (37b4); vendedor +preco (cat. 2), comprador -preco (cat. 0x15).
- Salario pedido ao comprador: `S0 = salario(jogador, X do comprador)` (doc 08);
  `pedido = Round( S0 * (rodada*0.2/14 + 1) * 1.1 / 50 / s ) * 50 * s` -> 10% acima, subindo ate +20% extra na rodada 14 (temporada de 14 rodadas).
  Segue para o dialogo de negociacao (1030:330e), nao lido.
- Corte de salarios (1010:6a08): cada salario vira Min(atual, recalculado); caixa negativo vira 0 [?] (falencia/reestruturacao).
