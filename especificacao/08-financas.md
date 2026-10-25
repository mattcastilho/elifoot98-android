# 08 - Financas: moeda, indice economico, salario e caixa inicial

Tudo inferido do assembly; NAO validado no jogo original. Marcado [?] onde ha duvida.

## 1. Moeda escolhida (DS:0x2d87)
- Dword gravado em tempo de execucao. Ha a pergunta "Com que moeda vai querer jogar?" (dialogo no segmento 1160), entao DS:0x2d87 = **escala da moeda** (s) escolhida no inicio. Todo valor em dinheiro e multiplo de s. s = 1 e a base.
- DS:0x09ae = 50000 (dword inicializado, constante do jogo).

## 2. Caixa inicial (1020:39c3, no fim da criacao de times)
`caixa = L * 50000 * s`, onde L e o nivel do time na lista global (doc 05, ex.: 49 para o mais forte, 1 para os mais fracos). Time +0x71 (caixa) e +0x75 (copia, "caixa inicial") recebem esse valor.
Nivel do estadio: `Max(1, Round(0.3 * L))` (doc 05, corrigido no doc 11), byte +4 do estadio (time +0x12).

## 3. Indice de riqueza (+0x79, extended)
Valor inicial **1.0** (construtor 1010:27fb). E a variavel X do salario (secao 5). Atualizado a cada rodada como media movel da riqueza relativa da divisao (doc 11, secao 3).

## 4. Indice economico (DS:0x2b46, real), atualizado em 1020:0c41 a cada rodada
- Estado: DS:0x2b40 = rodada atual; DS:0x2b42:0x2b44 = contador de TEMPORADAS (dword, incrementado no fim da temporada em 1020:038e; ver doc 13).
- Se (contador MOD 100) < 50: `indice += 0.01 * (R1 + R2 - R3)` (deriva media +0,005 por rodada).
- Senao: `indice += 0.01 * (R1 - R2 - R3)` (deriva media -0,005 por rodada).
- R1, R2, R3 = Random real em [0,1) independentes.
- Depois fixa: `indice = Min(indice, 10)` e `indice = Max(indice, 0.5)`.
- Valor inicial do indice: [?] provavelmente 1.0 (nao localizado).
- Efeito: o indice muda a cada rodada, subindo em media nas temporadas 0-49 de cada ciclo de 100 e descendo nas 50-99 (14 rodadas por temporada => ~+0,07 por temporada).

## 5. Salario de um jogador (1010:7ff4(slot, X))
Com F = forca do slot (+0x0a), X = fator do time (+0x79), s = escala, m = indice:
```
V = 35 * Sqrt(X) * s * m * F^1.04 * 1000^0.04          # [?] "Sqrt" = rotina 10c0:1285 (corpo exibe FSQRT)
S = Round(V / (50*s)) * 50 * s                         # multiplo de 50*s
S = Max(S, 50*s) ; S = Min(S, 50000*s)
se slot.+0x29 > 0 : S = f(slot.+0x31, S)               # [?] provavelmente Max; +0x31 = salario atual
```
Resultado grava em slot +0x31/+0x33. Chamadores: criacao do jogo (1020:39c3), fim de rodada (1010:3e9c, apenas rodada > 1 e nao-reserva [?]), e outras 6 rotinas ainda nao lidas.
Constantes: 1000^0.04 = 1.3183 ; Power(x,y) = Exp(y*Ln(x)) (1068:1194).

## 6. Pendencias
- Valor inicial de DS:0x2b46; origem do dialogo de moeda (tabela de valores de s).
- Receitas (bilheteria: textTicketPrice), emprestimo (juros: textLoanInterest, "Pedir dinheiro emprestado"), premios.
- Transferencias: ExecuteTransfers (1000:0c9e), TtransferPlayerDlg, preco de venda/compra; +0x29 (confirmar se e suspensao ou contrato).
