# 09 - Preco de jogador, folha salarial, emprestimo e rotina de gestao dos times do computador

Inferido do assembly; NAO validado. Confianca: ALTA nas formulas puras (371a, 3865, 3899, 4ec3, 5992), MEDIA/BAIXA na interpretacao da rotina 3aad.
Notacao: s = escala da moeda (DS:0x2d87), m = indice economico (DS:0x2b46, doc 08), F = forca individual do slot (+0x0a).

## 1. Preco de mercado de um jogador (1040:371a)
```
A = F^1.04 * s * m
preco = Round( 2000 * A * ( 1 - 0.2*(t/5) - 0.2*(g/10) + 0.2*(h/10) ) )
   t = slot +0x2d (temperamento / indisciplina, 0-5)        -> cada ponto custa 4% do preco
   g = slot +0x2f (fragilidade / propensao a lesao, 0-10)   -> cada ponto custa 2%
   h = slot +0x2b (fator = soma MOD 10 + 1)                 -> cada ponto soma 2%
```
Com a correcao do doc 04 (MOD em vez de DIV): t 0..5, g 0..10, h 1..10, entao o multiplicador fica entre 0,62 (t=5, g=10, h=1) e 1,20 (t=0, g=0, h=10).

## 2. Funcoes auxiliares
- 1010:4ec3(time) = media da forca (+0x0a) dos jogadores da lista: `Round(soma / quantidade)`.
- 1010:5992(time) = folha salarial: soma dos salarios (+0x31) dos slots com +0x36 == 0. [?] +0x36 provavelmente marca jogador emprestado/ja negociado.
- 1040:3865(x) = `Round(0.05 * x)` -> **juros de 5%** sobre a divida (campo do time +0x6d, dword).
- 1040:3899(time) = **limite de emprestimo**: `Round(media_forca * time.+0x5b * m * s * 20000)` arredondado para BAIXO a multiplo de q (q = DS:0x2d7f, dword da moeda, menor unidade); se der 0, usa q.

## 3. Rotina de gestao do time do computador (1010:3aad) - CORRIGIDO no doc 17: e decisao de VENDA, nao de compra
Condicoes de compra (so rodada > 1, sem controle humano [?]):
- caixa * 3 >= folha salarial;
- sorteio Random(20) != 0 (95%);
- se o time e de uma categoria "5" [byte +0x87 == 5], exige +0x88 >= 21 [?].
Escolha: percorre a lista de jogadores da outra lista (+0x0a do time alvo), calcula o interesse `5de1(time, jogador)` (real) e guarda o maior que passe os filtros (nao marcado, nacionalidade categoria 2 se o time e tipo "5"). Interesse (5de1), parcial: 
`interesse = (tabela[300h + ...]/(...)) * forca * (nivel_time+1)/...` com fatores 1.5 e 1.2 conforme a categoria de nacionalidade do jogador (+0x35 = 0 -> x1.5; 1 -> x1.2) [?].
Oferta: `Round(preco(371a) * DS:0x2b50 * 1.6)`, entregue a 1010:5b37. DS:0x2b50 e um real nao inicializado no codigo (valor inicial desconhecido).
Depois, ajuste de divida:
1. Enquanto divida > 0 e `caixa - folha - 5%*divida > q`: paga divida (668d).
2. Enquanto `5%*divida + folha > caixa` e divida < limite: toma emprestimo (665e) [?].
3. Se a lista de treinadores permite (c030) e `2*valor + c172 < caixa`: troca/demite treinador (c081, 58bf) [?].

## 4. Pendencias
- Origem de DS:0x2b50, 0x2d7f (q) e valor inicial de 0x2b46: sao gravados em bloco (carregar jogo / dialogo de moeda 1160).
- Fluxo humano de transferencia (JogadorTransferirClick, TtransferPlayerDlg): nao lido. "ExecuteTransfers" so aparece como nome publicado em 1000:0c9e (tabela de metodos); o codigo esta numa rotina nao identificada.
- Precos de venda ao humano, multa, janela de transferencias, bilheteria.
