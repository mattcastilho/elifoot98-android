# 15 - Arquivos .TXE (paises, arbitros, grupos) e tabela de moedas

## 1. Formato .TXE (COUNTRY.TXE, REFEREE.TXE, ctrgroup/*.txe)
Sequencia de strings Pascal (byte de tamanho + bytes). Cada string esta cifrada DUAS vezes com a cifra do .EFT (doc 01):
o leitor 1068:086d le a string e aplica 1068:07a4; o chamador (ex.: 1058:016d) aplica 07a4 de novo.
Decifrar = aplicar duas vezes `para i de n ate 1: s[i] = (s[i] - s[i-1]) mod 256` (s[0] = tamanho).
- COUNTRY.TXE: cabecalho "Country" + 217 linhas "COD Nome" (ex.: "BRA Brasil"). Nomes de arquivo montados em codigo ("\\" + "country.txe").
- REFEREE.TXE: cabecalho "Referee" + 182 linhas "PAIS Nome do arbitro". Sem atributos numericos: o efeito do arbitro sai das letras do nome e do pais (doc 11, secao 7).
- ctrgroup/*.txe: grupos de paises (nome + lista de codigos): "Bosman" (17 paises europeus) e "PLOP" (paises de lingua portuguesa). Uso provavel: jogadores desses paises nao contam como estrangeiros [?].
- Ferramenta: especificacao/ferramentas/txe_decode.py.

## 2. Tabela de moedas (segmento de dados, DS:0x0062, 4 registros de 101 bytes)
Registro: nome[20], sufixo[20], abreviatura[20] (strings Pascal de 21 bytes), 7 dwords, 1 extended. Copiado para DS:0x2d6a.. na escolha da moeda ("Com que moeda vai querer jogar?").
| campo (DS) | Escudos (contos) | Euros | Dolares | Reais | uso |
|---|---|---|---|---|---|
| 2d7f q | 100000 | 500000 | 500000 | 500000 | unidade do emprestimo (doc 09) |
| 2d83 | 1 | 4 | 4 | 4 | [?] |
| 2d87 s | 1 | 4 | 5 | 5 | escala de todos os valores (doc 08) |
| 2d8b | 1000 | 1 | 1 | 1 | divisor de exibicao (precos em "contos") |
| 2d8f premio 1 | 3 000 000 | 15 000 000 | 20 000 000 | 20 000 000 | fim de temporada, 1o time de 304c (campeao?) |
| 2d93 premio 2 | 1 000 000 | 5 000 000 | 6 000 000 | 6 000 000 | 2o time de 304c (vencedor da taca?) |
| 2d97 premio 3 | 500 000 | 3 000 000 | 3 000 000 | 3 000 000 | [?] destinatario nao identificado |
| 2d9b u | 0.5 | 2.0 | 2.0 | 2.0 | arredondamento do bilhete (so se > 1, doc 11) |
Premios pagos em 1020:2bf6 (categoria 3 do livro-caixa), chamada por 1020:304c no fim da temporada.
