# 16 - Resultados do simulador de temporadas (jogo/temporada.py)

Base: times de Portugal dos .EFT originais (41 times: 4 divisoes de 8 + 9 na Distrital), moeda Escudos (s = 1), 40 temporadas, semente 42.
Comando: `python temporada.py 40 POR 1` (sinal da evolucao como lido) e `python temporada.py 40 POR -1` (invertido).

## 1. O que parece saudavel
- Partida: 2,6 a 3,0 gols por jogo, mandante vence 43-50%, empates 22-32%; ~0,7 expulsao e ~0,4 lesao por jogo.
- Calendario, copa, classificacao, acesso e descenso funcionam sem erros por 40 temporadas.

## 2. Problemas encontrados (prioridades de validacao)
| # | sintoma | causa provavel |
|---|---|---|
| 1 | Forca media da 1a divisao cai de ~43 para ~26-28 em 40 temporadas (faixa-alvo 38-52) | lesao tira 10 de forca de forma permanente (doc 07); a evolucao de +-1 por rodada nao repoe. Conferir se o original devolve a forca ou se o declinio existe de fato |
| 2 | Com o sinal "como lido" (+1), um mesmo time vence quase todas as temporadas (dinastia) | titulares perdem forca e reservas ganham; o efeito depende do sinal do doc 12 - com o sinal invertido ha alternancia de campeoes |
| 3 | A Distrital fica mais forte que a 4a (e as vezes a 3a) | rebaixados chegam fortes e a Distrital quase nao joga (so a copa), entao o contador +0x0c quase nao muda e a forca nao converge; e os 2 que sobem sao sorteados |
| 4 | Muitas rodadas com caixa zerado em todas as divisoes, enquanto a mediana da 1a divisao acumula dezenas de milhoes | folha paga a cada jogo e renda so como mandante; faltam receitas nao modeladas (compras/vendas, premio 3) e a regra exata de falencia (6a08) |

## 3. O que falta modelar no simulador
Compras e vendas entre times (doc 09, confianca baixa), penaltis durante o jogo, premio 3, treinadores, formacao escolhida pelo computador (usado 4-4-2), limites de elenco/estrangeiros.

## 4. Conclusao
O motor esta completo o bastante para rodar o jogo, mas o equilibrio de longo prazo depende de 3 pontos que so a observacao do original resolve:
(a) a forca volta depois da lesao? (b) quem joga mais melhora ou piora? (c) como os times pequenos se sustentam (vendas? premios?).
Um teste curto no original responde (a) e (b): acompanhar a forca de 3-4 jogadores do proprio time por 5 rodadas (um titular, um reserva, um que se lesione).
