# 01 - Formato dos arquivos de equipa (.EFT)

Resultado da analise de caixa-preta dos 281 arquivos em `original/equipas/`. A ferramenta `ferramentas/eft_decode.py` le todos eles sem erro e o tamanho calculado bate com o tamanho real em 281/281 arquivos.

## Cifra de textos
Todo texto e uma *string Pascal cifrada*: 1 byte com o tamanho `L`, seguido de `L` bytes.
Cifra por soma acumulada: `c[i] = p[i] + c[i-1] (mod 256)`, com `c[-1] = L`.
Decifrar: `p[i] = c[i] - c[i-1]`, com `c[-1] = L`. Codificacao dos caracteres: Windows-1252 (ex.: `Ç`, `ã`, `é`).

## Layout (little endian, sem alinhamento)
| Offset | Tamanho | Campo |
|---|---|---|
| 0x00 | 3 | Assinatura `45 46 61` ("EFa") |
| 0x03 | 47 | Zeros (reservado) |
| 0x32 | var | Nome longo da equipa (string cifrada, em maiusculas) |
| - | var | Nome curto (string cifrada) |
| - | 8 | Duas cores, cada uma `R,G,B,0` (cor 1 = camisa, cor 2 = segunda cor; ex.: Benfica ff ff ff 00 / ff 00 00 00) |
| - | var | Pais da equipa (string cifrada, 3 letras: POR, BRA, ING...) |
| - | 1 | **Forca da equipa**, de 1 a 20 (varia entre equipas: 5 e o valor mais comum) |
| - | 1 | **Numero de jogadores** N (14 a 20; 165 de 281 equipas tem 20) |
| - | 1 | Reservado (sempre 0) |
| - | N registros | Jogadores (abaixo) |
| - | var | Nome do treinador (string cifrada) |

Registro de jogador:
| Campo | Tamanho | Observacao |
|---|---|---|
| Nacionalidade | string cifrada | 3 letras (POR, BRA, RCH...) |
| Nome | string cifrada | em caixa mista |
| Posicao | 1 byte | 0 = goleiro, 1 = defesa, 2 = meio-campo, 3 = ataque. Ordenados por posicao |
| Extra | 1 byte | Sempre 0 nos 5.241 jogadores analisados |

## Observacoes importantes
- **Nao ha atributos individuais (forca, idade, salario) no arquivo.** O unico valor numerico de qualidade e a forca da equipa (1-20). Conclusao provisoria: o jogo deriva a qualidade dos jogadores da forca da equipa, possivelmente com aleatoriedade; a confirmar ao analisar ELIFOOT.EXE (rotina de carga de equipa) e comparando com o jogo em execucao.
- Distribuicao de posicoes nas 281 equipas: goleiros 606, defesas 1807, meios 1682, atacantes 1146.
- Os dados (nomes, equipas) sao do original e nao devem ser reutilizados no jogo novo. Para o jogo novo, usar equipas e jogadores fictiveis, no mesmo modelo de dados: `forca (1-20)`, `cores`, `pais`, lista de jogadores com `posicao`.

## Pendencias
- Confirmar o significado do byte "Extra" e do byte reservado (talvez reservados ou usados em saves).
- Formatos de `COUNTRY.TXE`, `REFEREE.TXE`, `ctrgroup/*.txe` e `jogos/DRLIST.ELI` (a leitura direta com a mesma cifra do .EFT nao produziu texto legivel; podem ter outro cabecalho ou outra chave - a investigar).
