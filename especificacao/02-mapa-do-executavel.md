# 02 - Mapa inicial do ELIFOOT.EXE (Ghidra)

Fonte: `ghidra/elifoot_asm.txt` (exportado com `ferramentas/ghidra/ExportAsm.java`). 3.254 funcoes reconhecidas, 2.998 com corpo; 2.492 sem nome (`FUN_<segmento>_<offset>`). Enderecos no formato `segmento:offset` (Windows 3.1, 16 bits).

## Organizacao por segmentos (unidades Delphi)
| Segmento | Conteudo identificado |
|---|---|
| 1000, 1008, 1018, 1020, 1028, 1030, 1048, 1050 | Formularios/dialogos (editor, substituicoes, venda, classificacao, sorteio, fim de epoca, emprestimo, estadio, balanco, penaltis, plantel...) |
| 1010 | **Modelo de dados**: classes `TListOfTeams`, `TListOfDivisions`, `TListOfPlayers`, `TListOfCoaches`, `TListOfLastResults`, `TListOfGames`, `TListOfReferees`, `TCalendar`, `TCalendarEntry`, `TDivision`, `TPlayer`, `TCoach`, `TCoachEvent`, `TTeamEvent`, `TLastResult`, `TReferee`, `TStadium`, `TGameEvent`, `TLastWinners` |
| 1058 | `TCountry`, `TPlayerAttr`, `TTeamAttr`, `TCoachAttr`, `TRefereeAttr` (atributos), `TElifootObject`, editor de equipas |
| 1060-1098, 10a0-10b8 | Biblioteca de componentes Delphi (VCL), Classes, Graphics, Menus - ignorar |
| 10c0 | Biblioteca de execucao (System) |
| 10c8 | Dados/strings (moedas, mensagens de validacao, categorias de jogadores, lances) |

## Gerador de numeros aleatorios (System, segmento 10c0)
- `RandSeed` fica em `DS:0x247c` (32 bits).
- `10c0:218a`: avanca a semente (congruencial linear da Borland: multiplicador carregado de `CS:0x21c0`, incremento 1).
- `10c0:212d`: `Random(n)` inteiro: devolve a palavra alta da semente multiplicada por n (valor em 0..n-1). 37 chamadas no programa.
- `10c0:2167`: `Random` real em [0,1) (tipo Extended). 7 chamadas.
- `10c0:21c2`: `Randomize` (semente a partir do relogio do DOS).

## Funcoes que usam aleatoriedade (candidatas a regras)
| Funcao | Chamadas Random(n) | Tamanho (instr.) | Comentario |
|---|---|---|---|
| 1050:0d46 | 6 | 334 | Unidade do formulario de treinadores/emprestimo; a investigar |
| 1010:46df | 5 | 189 | Unidade do modelo de dados (TPlayer/TTeam): provavel geracao/evolucao de atributos |
| 1010:a6eb | 4 | 277 | Idem |
| 1010:81ed | 3 | 48 | Idem |
| 1020:038e | 2 | 626 | Formulario principal (Elifmain), funcao grande: candidata a motor/rodada |
| 1020:0c41 | 6 x Random real | 221 | Formulario principal; combina tres sorteios reais (aproximacao de distribuicao em sino) e acumula em `DS:0x2b46`; depende de contador em `DS:0x2b42` e rodada em `DS:0x2b40` |
| 1010:b0a1 | 1 x Random real | - | A investigar |

## Strings relevantes encontradas (segmento 10c8)
Categorias de comportamento de jogadores/arbitragem: "Fair play", "Cordeirinho", "Cavalheiro", "Caneleiro", "Caceteiro", "Sarrafeiro". Lances: "Defendeu", "Ao poste", "Ao lado", "Por cima". Moedas: escudos (contos), euros, lares (dolares), libras. Mensagens de validacao de plantel: pouco jogadores, sem guarda-redes, jogadores de campo insuficientes, demasiados estrangeiros.

## Limites desta analise
- O decompilador do Ghidra nao se aplica bem a este codigo de 16 bits; a leitura e feita sobre o assembly.
- As referencias a strings usam um segmento de dados que o Ghidra nao ligou as instrucoes; localizar rotinas pelas strings exige rastrear enderecos do segmento de dados (DS) manualmente.

## Proximos passos
1. Ler `1020:038e` e `1020:0c41` para saber se sao o motor de partida/rodada.
2. Ler `1010:46df`, `1010:a6eb`, `1010:81ed` (provavel derivacao dos atributos dos jogadores a partir da forca da equipa).
3. Montar a lista de campos de `TPlayer` / `TTeamAttr` a partir da inicializacao dessas classes.
