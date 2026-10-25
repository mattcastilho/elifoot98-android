# 17 - Mercado de transferencias dos times do computador

Inferido do assembly; NAO validado. Implementado em jogo/mercado.py. Substitui a leitura de 3aad do doc 09 secao 3 (era VENDA, nao compra).

## 1. Quando um time poe jogador a venda (depois de CADA jogo, 1010:a67f -> 1010:3e9c)
- Pedido de aumento: se o salario recalculado (7ff4) supera o atual em mais de 300, o jogador pede aumento (66dc, salario pedido do doc 11); se recusado, vai a leilao com minimo 0. [nao modelado no simulador]
- Caixa negativo: vende o jogador de MENOR utilidade (5de1) com minimo 0.
- 1010:3aad (rodada > 1): se `caixa*3 < folha`, ou sorteio Random(20) = 0 (5%), ou (5 estrangeiros e elenco >= 21, so estrangeiros): vende o de menor utilidade com minimo `floor1000(Round(preco * 1.6 * DS:0x2b50))`.
- Restricao 5a6a nao lida; simulador usa: manter >= 2 goleiros e >= 16 jogadores [?].

## 2. Utilidade de um jogador para o proprio time (1010:5de1)
`U = (5/(t+1))^(1/4) * cota_pos/(n_pos+1) * cota_total/(n+1) * F/(Fmed+1) * k_nac`, k_nac = 1.5 nacional, 1.2 grupo, 1.0 estrangeiro.
Cota (DS:0x300) por faixa Fmed DIV 10 (0..5): GK 3,3,3,4,4,4 ; DEF 8,8,8,8,9,9 ; MEI 7,7,8,8,8,8 ; ATA 3,4,5,5,5,5 ; total 22,22,23,24,25,26.

## 3. Leilao (TTransferPlayerDlg, 1008:3002 / 3787 / 3563 / 35f4)
- Cada outro time e consultado. Pode comprar (633d) se: elenco + chegadas < 24; e, se ja tem 5 estrangeiros (+ pendentes), so jogador nao estrangeiro; humano x humano nao.
- Precisa de caixa >= minimo. Computador oferece `oferta` (secao 4); humano recebe aviso (sempre, ou so se interesse > 1.0, conforme opcao) e da lance.
- Oferta arredondada para baixo a multiplo de 1000; vale se >= minimo e maior que a melhor ate entao. Ao final, a melhor e executada (1008:3a10, doc 11).
- Categoria de nacionalidade (1058:0a2f): 0 = do pais do time, 1 = mesmo grupo (ctrgroup: Bosman ou PLOP), 2 = estrangeiro [?].

## 4. Oferta do computador (1010:5f77(comprador, salario_pedido, jogador))
```
se cota[faixa][pos] == n_pos do comprador: oferta = 0
V = preco(jogador) (doc 09) * interesse(5bb1)
R = (caixa - V) / (folha + 1 + salario)
se R < 3: V = caixa - 3*(folha + salario)
senao se R > 5: V = V * Ln(R) / 1.6
se folha > 100 e caixa - V > 10*folha: V = V * (Ln((caixa - V)/folha - 9)/10 + 1)
oferta = Max(0, Min(Round(caixa - V - 5*folha), Round(V)))      # leitura literal [?]
```
Desconto para lesionado/suspenso existe no codigo mas opera sobre variavel ainda zerada: sem efeito (provavel bug do original).

## 5. Interesse (1010:5bb1)
`I = [ F/(Fmed+5) * (cota_pos+1)/(n_pos+1) * cota_total/(n+1) ]^(1/4) * Fmed^0.1`
x1.5 se goleiro e o comprador tem so 1; x(1.5 + 0.05*estrangeiros) nacional, x(1.15 + 0.05*estrangeiros) grupo, x1 estrangeiro; x1.1 se estrela.

## 6. Valores iniciais (afeta doc 08)
DS:0x2b46 (indice economico) e DS:0x2b50 (fator do preco pedido) so sao gravados pelo calculo da rodada e por salvar/carregar; nenhum codigo os inicializa num jogo novo. Variaveis globais nao inicializadas comecam em 0, entao [?]:
- indice comeca em 0 -> salarios iniciais no piso (50*s) e, apos a 1a rodada, indice = 0.5 (piso);
- fator 2b50 = 0 -> preco minimo pedido pelo computador = 0 (leilao puro).

## 7. Efeito no simulador (40 temporadas, Portugal, 15-25 transferencias por temporada)
| configuracao | F 1a / 2a / 3a / 4a / Dist (temp. 40) | campeoes | falencias (rodadas) |
|---|---|---|---|
| sem mercado, sinal +1 | 26 / 12 / 11 / 7 / 14 | dinastia (1 time) | 3932 |
| com mercado, sinal +1, indice 0 | 36 / 10 / 8 / 7 / 16 | variados | 1714 |
| com mercado, sinal -1, indice 0 | 30 / 21 / 19 / 13 / 26 | variados | 4562 (4a divisao quebra) |
| com mercado, sinal +1, indice 1 | 34 / 12 / 9 / 7 / 15 | variados | 2113 |
O mercado acaba com a dinastia e segura a forca da 1a divisao, mas concentra talento e dinheiro na 1a (mediana de caixa 60-80 milhoes contra ~1 milhao nas outras).
