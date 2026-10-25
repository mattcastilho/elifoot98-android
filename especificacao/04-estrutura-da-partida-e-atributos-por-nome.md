# 04 - Estrutura de um minuto de partida e atributos derivados do nome

Mesma ressalva do documento 03: **inferido do assembly, nao validado**. Itens com (?) sao hipoteses.

## 1. Descoberta importante: atributos "escondidos" saem do NOME do jogador
Rotina `1010:7516` (chamada por `1010:27fb`). Para cada jogador, calcula a partir da string do nome (codigos dos caracteres):
- `soma` = soma dos codigos ASCII (cp1252) do nome em claro. O nome fica cifrado na memoria (mesma cifra do .EFT) e e decifrado por `1068:07a4` dentro de `1058:13fe`; se o jogador ja tem o bonus (+0x1a = 1), esse nome de exibicao recebe o sufixo "*" (42), que entra na soma num recalculo.
- **CORRECAO (doc 10):** a divisao longa `10c0:1882` devolve quociente em DX:AX e RESTO em CX:BX; a rotina 7516 usa CX:BX, entao todas as operacoes abaixo sao MOD (a versao anterior deste doc dizia DIV). E `MOV AX,6 ; IMUL AX` = 36 (constante), nao 6*L.
- `slot.+0x2d` (temperamento t, 0..5) = `Round( 5 - Trunc( Sqrt( soma MOD 36 ) ) )`; se a posicao for defesa (1): `(t + 2) MOD 6`. Os 6 niveis de texto do jogo ("Fair play" ... "Sarrafeiro") provavelmente correspondem a t.
- `slot.+0x2b` (fator h, 1..10) = `soma MOD 10 + 1`.
- `jogador.+0x1a` (bonus/estrela) = 1 se h >= 8 e posicao >= 2 (meia ou ataque).
- `slot.+0x2f` (agressividade g, 0..10) = `soma MOD 11`.
- Conferido nos 5241 jogadores dos .EFT: h e g uniformes; t: 0=1222, 1=889, 2=1198, 3=957, 4=629, 5=346; estrela em 30,2% dos meias/atacantes.
Consequencia para o jogo novo: o original deriva esses valores de forma deterministica do nome; no jogo novo podemos escolher outra regra (ex.: atributos explicitos nos dados).

## 2. Quadro de um "minuto" (funcao 1048:069b)
Contador de minuto da partida em `partida.+0x18e` (0 a 90; 45 = intervalo; 90 = fim; 46 e 91 sao tratados em separado). A cada passo:
1. `1010:a6eb` - **gol** (penalti por sorteio Random(6000)/Random(7000), depois gol normal; doc. 03).
2. se nao houve evento: `1010:aa11` - evento tipo A (provavel **lesao**, ver abaixo).
3. se nao: `1010:ac72` - evento tipo B (provavelmente **cartao/expulsao**, a confirmar).
4. se nao e minuto 46/91 e o minuto > 0: `1010:aea7` - evento tipo C (a identificar).
5. `1010:afff` fecha o passo e o laco avanca ao proximo minuto.
No minuto 45 (`0x2d`) e no 90 (`0x5a`) ha tratamentos de intervalo e fim de jogo (`1048:0cef`, `1010:143e`, `1048:0afc`, `1048:0ba3`).

## 3. EXPULSAO (1010:aa11 + 1010:48be) - corrigido no doc 14 (antes lido como lesao)
- Sorteia `r = Random(1000)`. Se `r < 10` e `r > partida.+0x4c` (equipa 1) ou `r > partida.+0x4e` (equipa 2), ocorre o evento para essa equipa.
- A rotina `1010:48be` escolhe um jogador (`1010:100b`) e, se o campo `+0x2d` do jogador for maior que 0: tira-o da escalacao (`+0x10 = 0`), define `+0x27 = Random(4) + 1` (jogos de ausencia, 1 a 4) e incrementa o contador `+0x23`. +0x27 e exibido como "Suspenso por N jogo(s)" (1018:229f): e a SUSPENSAO por cartao vermelho. O peso do sorteio e o temperamento t (doc 07, modo 3).

## 4. Persistencia
`1010:7184` e `1010:8382` leem/gravam os slots no arquivo de save: campos em `+0x0a` (forca individual, 2 bytes), `+0x14`, `+0x27`, `+0x29`, `+0x2b`, `+0x2d`, `+0x2f`.

## 5. Pendente
- Gerar a forca individual `slot.+0x0a` a partir da forca da equipa do `.EFT`: **rotina ainda nao localizada** (nao esta nas funcoes lidas ate agora).
- Identificar o evento B e o evento C; escolha do marcador (`1010:44a1`); substituicoes automaticas; fim de jogo.
- Valor de `partida.+0x4c`/`+0x4e` e do real `+0x5b` da equipa (inicia em 1.0; ver quem o altera).
