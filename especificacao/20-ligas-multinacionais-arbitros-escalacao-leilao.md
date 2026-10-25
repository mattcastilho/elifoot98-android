# 20 - Ligas com varios paises, arbitros, escalacao do computador e leilao de venda

Inferido do assembly; NAO validado. Implementado em jogo/web/motor.js e app.html.

## 1. Selecao de paises e montagem da liga
- 1028:1604: ao abrir o jogo novo, conta os times de cada pais nos .EFT (pais +0x1e = cota inicial = total de times do pais).
- 1028:1975: o jogador marca/desmarca paises (pais +0x1d); 1028:1c68 marca todos os paises de um grupo (ctrgroup: Bosman, PLOP).
- 1028:1b95: enquanto o total de times marcados passar de 128, sorteia um pais da lista e, se estiver marcado e Random(128) < cota, tira 1 da cota.
  Paises grandes perdem mais times. Limite de 128 = 2^7, o tamanho maximo da Taca (7 fases nas rodadas pares).
- 1020:367a: para cada forca de 20 a 1, percorre os .EFT na ordem dos arquivos e inclui o time se o pais estiver marcado e ainda tiver cota.
  Resultado: UMA lista global, de varios paises, ordenada por forca (empates na ordem dos arquivos). Divisoes como no doc 05: 32 primeiros nas 4 divisoes, resto na Distrital.
- Correcao: o simulador antigo sorteava a ordem dos times de mesma forca; o original usa a ordem dos arquivos.

## 2. Arbitros
- REFEREE.TXE: 182 arbitros (pais + nome), doc 15.
- A cada rodada a lista e embaralhada (1010:0875 -> 1068:0f68) e cada jogo recebe o proximo arbitro (1010:1a66). "Nao ha arbitros suficientes" se faltar.
- x_casa = 2 + afinidade(arbitro, mandante), x_fora = afinidade(arbitro, visitante) (1010:8db2).
- afinidade (1010:c95c): soma, posicao a posicao do fim ao inicio (ate o maior comprimento), de (letra do nome do arbitro - letra do nome curto do time);
  v = |soma MOD 11|; +3 se o arbitro for do mesmo pais do time.
- Efeito (docs 07, 11, 18): x alto da mais penaltis ao lado e menos expulsoes, lesoes e gols anulados.

## 3. Escalacao do computador (1010:4388 -> 4b73 duas vezes)
- Embaralha o elenco (desempate ao acaso) e ordena por forca (+ slot +0x14, nao identificado).
- 1a passada: minimo 1 goleiro, 3 defensores, 3 meias, 2 atacantes, os melhores de cada posicao, sem lesionados/suspensos.
- 2a passada: completa as 2 vagas restantes com os melhores de qualquer posicao (ate 10 por setor) e poe ate 5 no banco; trocas = Min(banco, 3).
- Ou seja, o computador nao tem esquema fixo: o 11 e 1-3-3-2 mais os 2 melhores que sobrarem.

## 4. Leilao de venda (TTransferPlayerDlg, 1008:3002 / 3787 / 3563 / 35f4)
- O vendedor define o preco minimo. Cada clube e consultado em sequencia (timer); se pode comprar (24 jogadores, 5 estrangeiros) e tem caixa >= minimo, oferece (doc 17).
- Oferta valida se >= minimo e maior que a melhor ate entao. Ao fim, a melhor e executada (humano confirma).
- No jogo novo: os clubes aparecem um a um na tela; o jogador aceita a melhor ou recusa.
