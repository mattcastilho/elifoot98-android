# 03 - Forca da equipa por setor e probabilidade de gol por minuto

Origem: leitura do assembly em `ghidra/elifoot_asm.txt` (funcoes em `1010:397d`, `1010:46df`, `1010:a6eb`, `1010:44f5`, `1010:455d`, `1010:45b8`, `1010:81ed`, `1010:818c`). Constantes numericas lidas do executavel com `ferramentas/ne_bytes.py`.
**Estado: inferido do codigo, ainda NAO validado contra o jogo em execucao.** Itens marcados (?) sao hipoteses.

## 1. Estruturas (offsets descobertos)
Equipa (objeto de equipa em jogo):
| Offset | Significado |
|---|---|
| +0x4f | gols marcados na partida (incrementado quando ha gol) |
| +0x51 | soma de forca do setor **goleiro** (GK) |
| +0x53 | soma de forca do setor **defesa** (DEF) |
| +0x55 | soma de forca do setor **meio-campo** (MID) |
| +0x57 | soma de forca do setor **ataque** (ATT) |
| +0x59 | inteiro somado aos gols na formula do gol (?) |
| +0x5b | numero real de 6 bytes (Real48) usado como fator de ajuste (?) |

Posicao do jogador: byte em 0..3 = GK, DEF, MID, ATT (igual ao `.EFT`). Cada jogador no plantel tem um "slot" com campo `+0x0a` (forca individual, inteiro), `+0x10` (=1 se esta entre os titulares), `+0x2b` (inteiro, usado na formula de penalti) e ponteiro (`+6`) para o registro do jogador (posicao em `+0x19`, byte com sinal em `+0x1a`, nacionalidade em `+0x1b`).

## 2. Forca por setor (rotina 1010:397d)
1. Zera os quatro totais do setor.
2. Para cada jogador titular (campo `+0x10` = 1):
   `valor = 3 * (nacionalidade do jogador == pais da equipa ? 1 : 0) + forca_individual + 2 * byte_com_sinal(+0x1a)`
3. Soma `valor` ao total do setor da posicao do jogador.

## 3. Probabilidade de gol por minuto (rotina 1010:46df)
Entradas: equipa atacante A, equipa defensora B, lado (0 = mandante, 1 = visitante, inferido de 90/120 abaixo), minuto m.

Sejam GK, DEF, MID, ATT os totais dos setores.

1. **Comparacao por linhas** (sub-rotina 1010:45b8). Para k = 1, 2, 3:
   - k=1: a = 1 + A.DEF, b = 1 + B.ATT
   - k=2: a = 1 + A.MID, b = 1 + B.MID
   - k=3: a = 1 + A.ATT, b = 1 + (3*B.GK + B.DEF)
   - termo_k = peso_k * a / (a + b + 1), com peso = 2 para k=2 e 1 nos demais.
   `S = soma dos termos`
2. `P = 4 * (A.ATT + A.MID / 2)`  (sub-rotina 1010:455d)
3. `D = 3*B.GK + B.DEF + B.MID/2 + 1`  (sub-rotina 1010:44f5, mais 1)
4. `Q = 1 + P / D`
5. `G = S * ln(Q) * ((A.fator_real / 2) ^ (1/4))`   (raiz quadrada duas vezes do fator/2)
6. **Gol neste minuto** se:
   `( ( G - (A.gols + A.campo_0x59) > Random(90) )  OU  ( Random(180) = 0 ) )`  para o lado 0 (mandante)
   `( ( G - (A.gols + A.campo_0x59) > Random(120) ) OU  ( Random(270) = 0 ) )`  para o lado 1 (visitante)
   **E** `m > Random(45)` (gols menos provaveis nos minutos iniciais de cada bloco de 45).
   Depois escolhe-se o marcador (rotina 1010:44a1) e incrementa-se `A.gols`.

`Random(n)` = inteiro uniforme em 0..n-1 (gerador congruencial da Borland, semente em DS:0x247c).
O fator de casa e a diferenca 90 vs 120 (e 180 vs 270).

## 4. Penaltis marcados no tempo normal (rotina 1010:a6eb)
- Sorteia `Random(6000)` para uma equipa e `Random(7000)` para a outra e compara com campos da partida (`+0x4c` e `+0x4e`) que representam a propensao a penalti (?). Se o sorteio for menor, ou se uma condicao especial de fim de jogo se cumprir, chama a rotina de cobranca (1038:39b6). Resultado = 1 -> gol de penalti.
- Se nenhum penalti converte, tenta o gol normal (secao 3) para a equipa 0 e depois para a 1.

## 5. Resultado de uma cobranca de penalti (rotina 1010:81ed)
`a = Random(valor(cobrador))`, `b = Random(forca_individual do goleiro)`,
`valor(jogador) = Round( (posicao+1) * forca_individual * (campo_0x2b/10 + 1) / 2 )` (rotina 1010:818c).
Resultado:
- Com probabilidade 1/4 (`Random(4) = 0`) pode haver falha por lance: a < 4 -> "Ao lado" (5); a < 10 -> "Por cima" (6); a < 12 -> "Barra" (4); a < 13 -> "Poste" (3).
- Caso contrario: a < b -> "Defendeu" (2); senao -> "Gol" (1).
(Codigos 1 a 6 coincidem com a ordem das mensagens "Defendeu / Ao poste / barra / Ao lado / Por cima" do executavel; a numeracao 1 = gol e 2 = defendeu e inferencia.)

## 6. Ainda desconhecido (o que falta para uma copia fiel da mecanica)
- Como nasce a `forca_individual` (slot +0x0a) e o byte `+0x1a`: o `.EFT` so guarda a forca da equipa (1-20); a derivacao esta noutra rotina (nao localizada ainda).
- O que sao `campo_0x59` e o real `+0x5b` da equipa.
- Como o jogo sorteia o marcador, cartoes, lesoes e substituicoes automaticas.
- Financas, transferencias e calendario.

## 7. Como validar
Implementar as formulas num simulador e comparar a distribuicao de resultados com partidas reais do jogo (por exemplo, equipas de forca 15 contra 5): o jogo original pode ser rodado no navegador (js-dos) para coletar uma amostra.
