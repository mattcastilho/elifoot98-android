// Testes do motor com a liga ficticia (nao precisa do Elifoot 98).  node testes/motor.test.js
const assert = require('assert');
const M = global.Motor = require('../web/motor.js'); const D = require('../web/dados.js');
const liga = D.gerarLiga(7);
const st = M.criarJogo(liga, ['POR'], null, 'Teste', 42, { moeda: 'reais', humanos: [{ nome: 'Teste' }] });
assert.strictEqual(st.m, 2.0, 'indice economico inicial 2,0 (validado no original)');
assert.strictEqual(st.nDiv, 4);
st.times.forEach(t => assert.strictEqual(t.caixa, t.L * 50000 * 5, 'caixa = L x 50000 x s'));
// calendario: cada par de times se enfrenta 2 vezes, com mando invertido no returno
const pares = new Map();
M.TABELA.forEach((r, i) => r.forEach(([a, b]) => { const k = [a, b].sort().join('-'); pares.set(k, (pares.get(k) || []).concat([[i, a]])); }));
assert.strictEqual(pares.size, 28);
pares.forEach(v => { assert.strictEqual(v.length, 2); assert.notStrictEqual(v[0][1], v[1][1]); });
let gols = 0, jogos = 0, etapas = [];
while (st.temporada < 3) { const e = M.proximaEtapa(st); const r = M.jogarEtapa(st); etapas.push(e);
  for (const d of r.divisoes) for (const j of d) { gols += j.gc + j.gf; jogos++; } }
assert.ok(etapas.filter(e => e === 'copa').length >= 2, 'a Taca/Copa e uma rodada propria');
assert.ok(st.recordes.temporadas.length === 2 && st.recordes.temporadas[0].taca !== '—', 'temporada termina com campeao da copa');
const media = gols / jogos; assert.ok(media > 1.5 && media < 4, 'media de gols plausivel: ' + media.toFixed(2));
console.log('ok -', jogos, 'jogos, media de gols', media.toFixed(2), '-', st.nTransf || 0, 'transferencias');
