# 21 - Validacao no jogo original (memoria do emulador)

Metodo: Elifoot 98 rodando em elifoot98.com.br (js-dos), controlado pela API `ci` (teclado, mouse relativo, `readMemory`).
Partida de teste: 14 paises marcados (148 equipas), moeda Reais (s = 5), humano "teste" sorteado no CAGLIARI (4a divisao).
Os valores abaixo foram lidos diretamente da memoria, nao inferidos do assembly.

## 1. Como achar os dados na memoria
- Segmento de dados (DS): procurar os bytes do arquivo ELIFOOT.EXE em DS:0x9a0 ("E\0VBXPOSTPROP\0P..."); DS = endereco - 0x9a0.
- Equipa (objeto, VMT 13ff:022b): +0x12 estadio, +0x5b moral (real48), +0x71 caixa (longint), +0x75 caixa inicial, +0x79 X (extended).
- Jogador (VMT 13b7:0fef no fim do bloco de campos, nome logo depois): nome Pascal CIFRADO com a mesma cifra de soma do .EFT.
  Relativo ao byte de tamanho do nome (n): n-50 forca (word), n-48 contador c de minutos (int16, doc 07),
  n-37 jogos disputados, n-29 lesionado, n-19 jogos de lesao, n-17 h, n-15 t, n-13 g, n-11 salario (word), n+23 nacionalidade.

## 2. Confirmado
| Item | Resultado |
|---|---|
| Numero de equipas no jogo | **128** objetos de equipa (33 com L>1, 95 com L=1), apesar do aviso "O Elifoot so comporta 120 equipas". Limite 128 mantido. |
| Minimo de equipas | o dialogo de paises exige 34. |
| Divisoes | 4 divisoes de 8 + Distrital (96); so as 4 divisoes jogam o campeonato. |
| Nivel L por posicao | exatamente doc 05: 49, 47, 46, 44, 43, 41, 40, 38 ... 7, 5 (cinco times com 5) e 1 para o resto. |
| Forca inicial | L-3 .. L+3 (Cagliari, L=5: forcas 2..8). |
| Caixa inicial | L x 50000 x s (Cagliari: 1 250 000 reais). +0x75 = copia. |
| Indice economico DS:2b46 | **2.0** no inicio do jogo (o motor usava 0). |
| Fator do preco DS:2b50 | **1.0** no inicio. |
| Contador de temporadas DS:2b42 | comeca no **ano do relogio** (2026); a regra "MOD 100 < 50" usa o ano. |
| X da equipa (+0x79) | 1.0 (0,9911 nos 8 times da divisao do humano depois da 1a atualizacao). |
| Salario inicial | formula do doc 08 com m = 2: F=2 -> 1000, 3 -> 1500, 5 -> 2500, 6 -> 3000, 8 -> 4000, 47 -> 25250, 50 -> 27000 reais. |
| Atributos pelo nome (h, t, g) | batem com doc 04/10 para todos os jogadores conferidos. |
| Evolucao (doc 12) | **sinal confirmado**: quem joga perde forca, quem fica de fora ganha. Em 2 rodadas: titulares com c<0 caem 1 em ~45% das vezes; reservas com c>0 sobem 1 em ~75%. c acumula entre rodadas (nao zera). |
| Lesao | forca -10 com piso 1 (6 -> 1, 10 -> 1 etc.); fica marcado n-29 = 1 e n-19 = jogos de afastamento. |
| Golo anulado | existe ("Pessotto 46' - Anulado"). |
| Publico | Juventus (F~47) 58 922, Man United 55 268, Cagliari (F~4) 4 329 - compativel com a formula do doc 11. |
| Media de gols | 70 gols em 32 jogos (2,19 por jogo) nas 2 primeiras rodadas; motor: 2,6 (dentro do ruido de amostra tao pequena). |

## 3. Novidades vistas na interface
- Dialogo "Jogadores": ate **6 treinadores humanos**; o botao "Sortear equipas" sorteia o clube (o teste caiu na 4a divisao).
- Menu Seleccionar: 3-3-4, 3-4-3, 4-2-4, 4-3-3, 4-4-2, 4-5-1, 5-2-3, 5-3-2, 5-4-1, 5-5-0, 6-3-1, 6-4-0 (F1-F12), Automatico (A), Melhores (M).
  Esquemas sem jogadores suficientes ficam desabilitados. "Automatico" escalou 4-3-3 com os melhores de cada setor.
- Intervalo: dialogo com caixas "Cartoes vermelhos" e "Lesoes" (pausar nesses eventos).
- Lesao de jogador do humano: dialogo obrigatorio para escolher o substituto.

## 4. Em aberto
- Calendario: os pares das rodadas 1 e 2 da 4a divisao batem com o round-robin do motor sob uma permutacao das posicoes, mas mandante/visitante nao. Os 14 bytes em equipa+0x22 parecem ligados ao calendario e nao foram decifrados.
- Pool exato do "Sortear equipas" e limite exato do mercado (precisa de mais rodadas no original).
- Repeticao de penalti e disputa por penaltis: o motor usa 5 cobrancas + morte subita e repeticao com Random(3) apos defesa [?].
- Final da Taca em campo neutro: implementado como hipotese [?].
