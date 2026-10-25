# 10 - Correcao: atributos do nome usam MOD, nao DIV

Revisao da rotina 1010:7516 (doc 04) motivada pela incoerencia de escala no preco do jogador (doc 09).
1. A divisao longa do runtime (10c0:1882) deixa o quociente em DX:AX e o resto em CX:BX. 7516 sempre le CX:BX -> MOD.
   Confirmacao cruzada: 1040:3899 usa DX:AX logo apos 1882 e multiplica por q (arredonda para baixo a multiplo de q), coerente com DX:AX = quociente; 1020:0c41 le CX:BX e compara com 50 (ciclo MOD 100), coerente com CX:BX = resto.
2. `MOV AX,0x6 ; IMUL AX` = 36, constante.
3. O nome usado e o de exibicao (1058:13fe): decifrado + "*" se ja tiver bonus.
Formulas corretas e contagens nos .EFT: ver doc 04, secao 1. Docs 07 e 09 e jogo/ atualizados.
