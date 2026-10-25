# 00 - Reconhecimento do Elifoot 98

Documento de reconhecimento tecnico. Contem apenas observacoes sobre o formato e a estrutura do programa original. Nenhum codigo do original deve ser copiado para `jogo/`.

## Origem dos arquivos
Extraidos do pacote `elifoot98.jsdos` do repositorio `elifoot98web/elifoot98web` (wrapper Angular/Ionic + js-dos, licenca MIT valida so para o wrapper). O pacote contem um Windows 3.1 e a pasta `eli98`, copiada aqui em `original/`. O disco `hdd.img` (Windows 3.1) nao foi copiado.
Inicio do jogo no pacote: `win d:\eli98\elifoot.exe`.

## Executaveis
| Arquivo | Tamanho | Formato | Observacao |
|---|---|---|---|
| ELIFOOT.EXE | 836.356 B | NE (Windows 3.x, 16 bits) | O jogo |
| EDITEQ.EXE | 472.532 B | NE (Windows 3.x, 16 bits) | Editor de equipas |
| elikg.exe | 38.219 B | MZ (DOS), comprimido com LZEXE 0.91 | Provavelmente gerador de codigos/chaves |
| BIVBX11.DLL, GAUGE.VBX | 80 KB / 8 KB | NE DLL / VBX | Suporte a controles (barra de moral etc.) |

## Compilador e linguagem
ELIFOOT.EXE foi feito em **Borland Delphi 1** (Object Pascal de 16 bits): a string `Borland Delphi / Portions Copyright (c) 1983,95 Borland`, 50 ocorrencias de `TPF0` (formularios serializados da VCL), uso de CTL3DV2.DLL.
Consequencias para a analise:
- Os nomes dos metodos de eventos dos formularios estao preservados nos recursos (ex.: `JogadorTransferirClick`, `ChangeSalaryBtnClick`, `ExecuteTransfers`), o que ajuda a localizar cada rotina.
- Nomes de classes/formularios: `TMAINWINDOW`, `TTRANSFERPLAYERDLG`, `TASKMORESALARYDLG`, `TPENALTYDLG`, `TLOANDLG`, `TBALANCEDLG`, `TSTADIUMDLG`, `TSORTEIODLG`, `TCLASSIFICATIONDLG`, `TENDOFSEASONDLG`, `TREFEREEAIDDLG`, `TSUBSTITUTIONDLG`, `TTEAMSKILLDLG`, `TPLANTELDLG` etc.
- Controles de moral: `gaugeMoral`, `gaugeOpponentMoral`.
- Tipos Pascal encontrados: `TPlayerTransfer`, `TLastTransfer`, `TFileFormat`.
- Ferramentas adequadas: Ghidra (suporta NE de 16 bits). O REA e voltado a x64 moderno e precisa ser testado; DeDe nao serve (e para Delphi 2+).

## Arquivos de dados
| Pasta/arquivo | Conteudo | Estado |
|---|---|---|
| `equipas/*.EFT` | 281 equipas, 273 a 578 bytes cada | Formato ofuscado; ver abaixo |
| `COUNTRY.TXE` | 2.945 B, paises | Ofuscado |
| `REFEREE.TXE` | 3.445 B, arbitros | Ofuscado |
| `ctrgroup/*.txe` | Bosman.txe, Plop.txe | Nao analisado |
| `jogos/DRLIST.ELI` | 8 KB, lista de sorteio/jogos | Registros de 14 bytes aparentes; nao analisado |
| `flags/*.BMP` | 218 bandeiras | Imagens (nao reutilizar) |

### Formato .EFT (hipotese inicial)
- Cabecalho: bytes `45 46 61` ("EFa") no inicio, seguidos de zeros ate cerca do byte 0x30.
- Depois do cabecalho, os textos (nomes de jogadores, equipa) parecem codificados byte a byte: cada string comeca com um byte de tamanho e os caracteres seguintes dependem do anterior (padrao tipo cifra encadeada), por isso aparecem sequencias como `03 53 a2 f4`.
- Proximo passo: obter pares conhecidos (equipa no jogo vs. bytes do arquivo) abrindo uma equipa no EDITEQ e comparando, ou localizar a rotina de leitura em ELIFOOT.EXE no Ghidra.

## Proximos passos
1. `01-partidas.md`: regra de resultado de partida (atributos, aleatoriedade, gols).
2. Decodificar o .EFT para entender atributos de jogador (forca, posicao, idade, salario...).
3. `02-financas.md`: bilheteria, salarios, patrocinio, emprestimo.
4. `03-transferencias.md`, `04-lesoes-cartoes.md`, `05-competicoes.md`.
5. Implementar tudo do zero em `jogo/`, com nome, times, escudos e visual proprios.
