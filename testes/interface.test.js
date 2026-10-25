// Teste da interface no tamanho de um celular (Playwright).  cd web && python montar.py && cd .. && node testes/interface.test.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const erros = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../web/elifoot.html')); await p.waitForTimeout(300);
  await p.click('#novo'); await p.click('#ok'); await p.click('#ok');
  await p.fill('[data-j="0"]', 'Teste'); await p.click('#sortear'); await p.click('#sortear');
  await p.evaluate(() => { ST.opcoes.tempo = 'rapido'; });
  for (const a of ['financas', 'adversario', 'jogador', 'seleccao']) await p.click(`[data-aba=${a}]`);
  for (let k = 0; k < 2000; k++) {
    if (await p.evaluate(() => ST.rodada >= 3 && !document.querySelector('.jornada') && !document.querySelector('#dlg .janela'))) break;
    if (await p.$('#jogar:not([disabled])')) { await p.click('#jogar'); continue; }
    const dlg = await p.$('#dlg .janela');
    if (dlg) { for (const s of ['#cont', '#ok', '#sim']) { const el = await p.$('#dlg ' + s); if (el) { await el.click().catch(() => {}); break; } } await p.waitForTimeout(50); continue; }
    if (!(await p.$('.jornada')) && await p.$('[data-aba=seleccao]')) await p.click('[data-aba=seleccao]');
    await p.waitForTimeout(150);
  }
  const larg = await p.evaluate(() => document.documentElement.scrollWidth); if (larg > 390) erros.push('rolagem horizontal ' + larg);
  console.log('rodada', await p.evaluate(() => ST.rodada), erros.length ? erros : 'ok');
  await b.close(); process.exit(erros.length ? 1 : 0);
})();
