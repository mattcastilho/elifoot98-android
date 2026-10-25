# 06 - Resultados do simulador de partida

Simulador: `../jogo/simulador_partida.py` (implementacao propria das regras dos docs 03 e 05, 4-4-2, equipas geradas). 4.000 jogos por confronto, mandante primeiro. `pos` = posicao da equipa na lista global (0 = mais forte; doc. 05).

| casa | fora | vit. casa | empate | vit. fora | gols casa | gols fora |
|---|---|---|---|---|---|---|
| 0 | 0 | 42,2% | 33,6% | 24,1% | 1,35 | 1,07 |
| 8 | 8 | 42,2% | 33,6% | 24,1% | 1,35 | 1,07 |
| 16 | 16 | 42,2% | 33,6% | 24,1% | 1,35 | 1,07 |
| 0 | 8 | 61,2% | 25,1% | 13,7% | 1,88 | 1,05 |
| 8 | 0 | 30,4% | 31,9% | 37,7% | 1,35 | 1,49 |
| 0 | 16 | 82,2% | 13,9% | 4,0% | 2,25 | 0,62 |
| 0 | 24 | 93,3% | 5,4% | 1,2% | 3,17 | 0,64 |
| 0 | 33 | 99,4% | 0,5% | 0,1% | 5,19 | 0,62 |
| 8 | 16 | 66,1% | 22,1% | 11,7% | 1,88 | 0,92 |
| 16 | 24 | 81,5% | 14,1% | 4,3% | 2,21 | 0,63 |
| 24 | 33 | 89,1% | 8,4% | 2,5% | 2,74 | 0,63 |
| 33 | 33 | 42,1% | 33,7% | 24,1% | 1,36 | 1,07 |
| 33 | 0 | 0,9% | 3,3% | 95,9% | 0,84 | 4,20 |

## Leitura
- **Equipas iguais:** ~2,4 gols por jogo, mandante vence ~42%, empate ~34%, visitante ~24%. E plausivel para futebol. O resultado e identico em qualquer nivel porque as formulas dependem de razoes entre setores.
- **Vantagem de casa:** vem da diferenca 90/120 (e 180/270) na tentativa de gol.
- **Forca:** a diferenca de resultado cresce com a distancia na lista, de forma gradual (posicoes 0 x 8: ~61% de vitoria; 0 x 24: ~93%).
- **Extremos:** a equipa 0 contra a 33 tem 99% de vitorias e 5 gols de media; isso sugere (?) que a regra `L = 1` para posicoes >= 33 pode ser diferente na pratica (outra escala ou outro modo de jogo), ou que o original realmente produz goleadas assim.

## Limitacoes
- Penaltis e campo `+0x59` da equipa foram tratados como 0 (valores nao descobertos).
- Sem substituicoes, lesoes, cartoes, moral nem esquema tatico; apenas gols por minuto.
- Nada disso foi comparado ainda com o jogo original em execucao. O proximo teste e jogar algumas partidas no original (por exemplo, equipas de posicoes bem distantes) e comparar placares medios.
