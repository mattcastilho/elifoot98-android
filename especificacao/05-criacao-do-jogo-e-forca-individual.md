# 05 - Criacao de um jogo novo: ordem das equipas, divisoes e forca individual

Resolve a pendencia dos documentos 03 e 04 ("como nasce a forca individual"). Fonte: `1020:3c2a` (inicializacao do jogo novo), `1020:367a`, `1020:3b94`, `1020:39c3`. **Inferido do assembly; nao validado no jogo em execucao.**

## 1. Sequencia na criacao de um jogo novo (1020:3c2a)
1. `1020:367a` - carrega as equipas dos arquivos `.EFT` e monta a **lista global de equipas**.
2. `1020:3b94` - distribui as equipas pelas divisoes.
3. `1020:39c3` - atribui a **forca de cada jogador**, a forca do treinador e o dinheiro de cada equipa.

## 2. Ordem das equipas (1020:367a)
- Percorre os arquivos de `equipas\` repetidamente, com `f` de **20 ate 1** (forca de equipa lida do cabecalho, byte depois do pais; ver doc. 01).
- Em cada passo, aceita as equipas cuja forca no arquivo e igual a `f`, desde que o **pais da equipa ainda tenha vaga** (cada pais tem um indicador e um contador de vagas restantes, decrementado a cada equipa aceita).
- Resultado: a lista global fica **ordenada da forca do `.EFT` mais alta para a mais baixa**, respeitando cotas por pais. A posicao `i` na lista (0 = a mais forte) e o que decide tudo o resto.

## 3. Divisoes (1020:3b94)
`divisao(i) = Min( i DIV 8, 4 )` (indices 0 a 4). Ou seja, grupos de 8 equipas por divisao, e a ultima divisao recebe as restantes. (Valor 8 e constante no codigo; outros modos de jogo podem usar outros tamanhos - a confirmar.)

## 4. Nivel base da equipa e forca dos jogadores (1020:39c3)
Para cada equipa na posicao `i` (0, 1, 2, ...):

```
se i <= 32:  L = Max( Round( 50 * (1 - i/32) ) - 1 , 5 )
senao:       L = 1
```
Valores: i=0 -> 49; 1 -> 47; 2 -> 46; 4 -> 43; 7 -> 38; 8 -> 37; 12 -> 30; 16 -> 24; 20 -> 18; 24 -> 11; 28..32 -> 5; 33 em diante -> 1.

Para **cada jogador** da equipa:
```
forca_individual = Min( Max( L + 3 - Random(7) , 1 ) , 50 )
```
(`Random(7)` = inteiro de 0 a 6.) Esse e o campo `slot.+0x0a` usado nas formulas dos documentos 03 e 04 (setores e penaltis). Portanto os jogadores de uma mesma equipa variam apenas de `L-3` a `L+3`, e todos dependem so da **posicao da equipa na lista**, nao de atributos individuais do arquivo.

Tambem nesta rotina (por equipa):
- **Treinador:** nivel = `Max( 1 , Round( 0.3 * L ) )`.
- **Dinheiro inicial:** `L * A * B`, onde A e B sao duas constantes/variaveis globais do programa (`DS:0x09ae` e `DS:0x2d87`), guardado em `equipa.+0x71` (e copiado em `+0x75`). Valores de A e B ainda por descobrir.
- **Salario/valor de cada jogador** (`slot.+0x31`) vem da rotina `1010:7ff4`, usando um numero real guardado em `equipa.+0x79` (inicial definido em `1010:27fb`) - a investigar.

## 5. Consequencias para o jogo novo
- A forca de equipa de 1 a 20 do `.EFT` serve so para **ordenar** as equipas; o que influencia os resultados e o nivel `L` derivado da posicao na ordenacao.
- O original usa uma escala de 1 a 50 para jogadores. Podemos manter essa escala ou usar outra, desde que as formulas dos setores (doc. 03) sejam recalibradas junto.
- Para validar: iniciar um jogo no original, anotar a forca mostrada para jogadores de equipas em varias posicoes e comparar com os intervalos `[L-3, L+3]`.

## 6. Ainda desconhecido
- Valores de `DS:0x09ae`, `DS:0x2d87` e do real em `equipa.+0x79`.
- Evolucao da forca ao longo das temporadas (rotina `1010:4a41` incrementa/decrementa o campo com sorteios).
- Eventos B e C do minuto (provaveis cartoes e outro), escolha do marcador, financas, transferencias, calendario.


> **Correcao (doc 11):** o valor `Max(1, Round(0.3*L))` descrito como "treinador" e o NIVEL DO ESTADIO (time +0x12, byte +4); capacidade = nivel * 5000.
