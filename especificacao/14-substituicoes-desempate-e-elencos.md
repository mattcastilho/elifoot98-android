# 14 - Escalacao automatica, substituicoes, desempate na copa e renovacao de elencos

Inferido do assembly; NAO validado.

## 0. CORRECAO importante (afeta docs 04, 07, 09)
Os eventos estavam trocados. Confirmado pelas mensagens da tela 1018:229f:
- slot +0x27 = "Suspenso por N jogos" -> gravado por 1010:48be (via aa11) => **aa11 e EXPULSAO**; peso do sorteio = temperamento t (+0x2d).
- slot +0x29 = "Lesionado por N jogos" -> gravado por 1010:4940 (via ac72) => **ac72 e LESAO**; peso = g (+0x2f), aqui chamado "fragilidade".
O resto dos numeros nao muda (doc 07 secao 2 reescrita).

## 1. Escalacao automatica (1010:4b73(time, formacao[4], ...))
- Exclui lesionados (+0x29 > 0) e suspensos (+0x27 > 0).
- Ordena o elenco por (forca +0x0a + slot +0x14), decrescente (comparador 1050:1958). [?] +0x14 nao identificado (forma/moral?).
- Escala 1 goleiro e os jogadores de linha conforme as quantidades por setor pedidas (formacao), pegando os melhores de cada posicao; marca setores com sobra.
- Banco: ate 5 reservas (+0x10 = 2). Estados do slot: +0x10 = 1 em campo, 2 banco, 0 fora.
- Substituicoes permitidas na partida: time +0x4d = Min(numero de reservas, 3).

## 2. Substituicao automatica (1010:67f7(time, sai, modo)) - so time do computador
Exige +0x4d > 0. Ao trocar: sai.+0x10 = 0, entra.+0x10 = 1, entra.+0x17 += 1 (jogos como suplente), +0x4d -= 1, recalcula setores.
- Lesao -> modo 0: entra o primeiro reserva da MESMA classe (goleiro por goleiro, linha por linha).
- Expulsao -> modo 1: so age se o expulso e o goleiro; entra o goleiro reserva e sai o ULTIMO jogador de linha em campo da lista (time fica com 10, mas com goleiro).
Nao ha substituicao tatica (por cansaco ou placar) no codigo lido.

## 3. Desempate na copa (1010:9396 ramo copa + 1050:0d46)
- Diferenca de gols decide; o perdedor sai da lista da copa (+0x30 = 1).
- Empate, sem time humano e antes da final (rodada < 14) -> disputa automatica:
  `A = Random(Fm) + Random(Fm) + Random(Fm)`, `B = idem com Fv` (F = forca media do time, 4ec3); mandante vence se A >= B.
  Os registros do calendario recebem codigo 2 (venceu nos penaltis) e 3 (perdeu).
- Com time humano ou na final -> disputa cobranca a cobranca na tela (segmento 1038), cada cobranca pela formula do doc 03 (81ed). Numero de cobrancas/morte subita: nao lido.
- Nao ha prorrogacao.

## 4. Renovacao de elencos
- Jogadores so sao criados ao montar um time a partir do .EFT (1010:27fb) ou ao carregar o save (292c). **Nao ha idade, aposentadoria nem geracao de jogadores novos.**
- Os elencos so mudam por transferencias; a forca evolui +-1 por rodada em torno da referencia (doc 12).
- Consequencia para o jogo novo: decidir se mantem elencos "eternos" (fiel ao original) ou acrescenta idade/aposentadoria/base (melhoria).

## 5. Regras de elenco (mensagens no segmento 10c8; limites numericos NAO localizados)
"Nao tem jogadores suficientes", "Tem demasiados jogadores", "Nao tem guarda-redes", "Nao tem jogadores de campo suficientes", "Tem demasiados jogadores estrangeiros", "Nao esta definido o treinador", "Nao pode vender mais jogadores/guarda-redes/jogadores de campo", "Este jogador so pode ser vendido na proxima epoca", "So pode tentar vender este jogador novamente no proximo jogo".
