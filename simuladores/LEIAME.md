# Simuladores (Python)

Primeira implementação das regras, usada para testar a especificação antes do jogo web.

- `simulador_partida.py` — partida com times fictícios (docs 03 e 04).
- `simulador_eventos.py` — eventos do minuto, substituições e desempates (docs 07 e 14).
- `financas.py`, `mercado.py`, `calendario.py` — finanças, mercado e calendário (docs 08, 09, 11–13, 17).
- `temporada.py [temporadas] [pais] [sinal]` — temporadas completas. Lê os `.EFT` da sua cópia do Elifoot 98 em `../original/equipas` (pasta não versionada).

O jogo jogável está em `../web/`; o motor de lá (`motor.js`) é a versão mais atual das regras.
