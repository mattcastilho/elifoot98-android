/* Motor do jogo — implementacao propria das regras documentadas em especificacao/03 a 18.
   Sem dados do original embutidos: os times vem de uma liga ficticia gerada ou de arquivos .EFT importados. */
"use strict";
const Motor = (() => {

// ------------------------------------------------------------------ aleatorio (estado salvavel)
function criarRng(seed) {
  let s = seed >>> 0;
  const r = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.n = (n) => n <= 0 ? 0 : Math.floor(r() * n);       // Random(n) do Pascal
  r.estado = () => s; r.definir = (v) => { s = v >>> 0; };
  return r;
}
let R = criarRng(1);

// ------------------------------------------------------------------ constantes (docs 05, 08, 15, 17)
const MOEDAS = {                                                                               // doc 15
  escudos: { nome: "Escudos (contos)", sufixo: " contos", q: 100000, s: 1, premio1: 3000000, premio2: 1000000, premio3: 500000, u: 0.5 },
  euros:   { nome: "Euros", sufixo: " euros", q: 500000, s: 4, premio1: 15000000, premio2: 5000000, premio3: 3000000, u: 2 },
  dolares: { nome: "Dólares", sufixo: " dólares", q: 500000, s: 5, premio1: 20000000, premio2: 6000000, premio3: 3000000, u: 2 },
  reais:   { nome: "Reais", sufixo: " reais", q: 500000, s: 5, premio1: 20000000, premio2: 6000000, premio3: 3000000, u: 2 } };
let MOEDA = MOEDAS.escudos;
const usarMoeda = (k) => { MOEDA = MOEDAS[k] || MOEDAS.escudos; return MOEDA; };
// menu "Seleccionar" do original (F1..F12), mais "Automatico" (A) e "Melhores" (M) - validado no jogo original
const FORMACOES = { "3-3-4": [1, 3, 3, 4], "3-4-3": [1, 3, 4, 3], "4-2-4": [1, 4, 2, 4], "4-3-3": [1, 4, 3, 3], "4-4-2": [1, 4, 4, 2], "4-5-1": [1, 4, 5, 1],
  "5-2-3": [1, 5, 2, 3], "5-3-2": [1, 5, 3, 2], "5-4-1": [1, 5, 4, 1], "5-5-0": [1, 5, 5, 0], "6-3-1": [1, 6, 3, 1], "6-4-0": [1, 6, 4, 0] };
const ESQUEMAS_ESPECIAIS = { auto: "Automático", melhores: "Melhores" };
const COTA = [[3,8,7,3,0,22],[3,8,7,4,0,22],[3,8,8,5,0,23],[4,8,8,5,0,24],[4,9,8,5,0,25],[4,9,8,5,0,26]];
const POS = ["GOL", "DEF", "MEI", "ATA"];
const NOME_POS = ["Goleiros", "Defensores", "Meio-campistas", "Atacantes"];
const GRUPOS = [
  ["POR","ESP","FRA","ITA","ALE","AUT","GRE","ING","ESC","WAL","ILN","IRL","DIN","BEL","HOL","LUX","FIN","SUE"],
  ["POR","BRA","ANG","MOC","CAV","STP","GBI","GNE","TIM"]];
const TEMPERAMENTO = ["Fair play", "Cordeirinho", "Cavalheiro", "Caneleiro", "Caceteiro", "Sarrafeiro"];

// ------------------------------------------------------------------ regras basicas
const nivelPorPosicao = (i) => i <= 32 ? Math.max(Math.round(50 * (1 - i / 32)) - 1, 5) : 1;   // doc 05
const forcaJogador = (L) => Math.min(Math.max(L + 3 - R.n(7), 1), 50);
const baseDivisao = (d) => 52 - 14 * d;                                                        // doc 12
const roundP = (x) => { const f = Math.floor(x), d = x - f; if (d > 0.5) return f + 1; if (d < 0.5) return f; return f % 2 === 0 ? f : f + 1; };

function atributosDoNome(nome, pos) {                                                          // doc 04/10
  let soma = 0; for (const ch of nome) soma += Math.min(ch.charCodeAt(0), 255);
  let t = roundP(5 - Math.trunc(Math.sqrt(soma % 36)));
  if (pos === 1) t = (t + 2) % 6;
  const h = soma % 10 + 1, g = soma % 11;
  return { t, h, g, estrela: (h >= 8 && pos >= 2) ? 1 : 0 };
}

function categoria(nac, pais) {                                                                // doc 15/17
  if (nac === pais) return 0;
  if (GRUPOS.some(gr => gr.includes(nac) && gr.includes(pais))) return 1;
  return 2;
}

// ------------------------------------------------------------------ financas (docs 08, 09, 11)
const salario = (F, X, m) => { const s = MOEDA.s;
  const v = 35 * Math.sqrt(Math.max(X, 0)) * s * m * Math.pow(F, 1.04) * Math.pow(1000, 0.04);
  return Math.min(Math.max(roundP(v / (50 * s)) * 50 * s, 50 * s), 50000 * s); };
const salarioPedido = (base, rodada) => roundP(base * (rodada * 0.2 / 14 + 1) * 1.1 / 50 / MOEDA.s) * 50 * MOEDA.s;
const precoJogador = (j, m) => { const A = Math.pow(j.f, 1.04) * MOEDA.s * m;
  return roundP(2000 * A * (1 - 0.2 * (j.t / 5) - 0.2 * (j.g / 10) + 0.2 * (j.h / 10))); };
const juros = (d) => roundP(0.05 * d);
const capacidade = (t) => t.estadio * 5000;
const mediaForca = (t) => t.jog.length ? roundP(t.jog.reduce((a, j) => a + j.f, 0) / t.jog.length) : 1;
const folha = (t) => t.jog.reduce((a, j) => a + j.sal, 0);
function limiteEmprestimo(t, m) { const q = MOEDA.q;
  let v = roundP(mediaForca(t) * t.fator * m * MOEDA.s * 20000); v = Math.floor(v / q) * q; return v || q; }
function precoBilhete(F, X, m, copa) {
  X = Math.max(X, 0.1);
  let p = roundP(MOEDA.s * m / Math.sqrt(X) * F / 5 * (1 + 0.5 * (copa ? 1 : 0))) / 2;
  p = Math.max(p, 0.5 * MOEDA.s);
  return MOEDA.u > 1 ? roundP(p / MOEDA.u) * MOEDA.u : p;
}
function publico(A, B, copa, neutro) {
  const base = (3 * mediaForca(A) + mediaForca(B) + 3 * R()) * Math.sqrt(A.fator) * Math.sqrt(B.fator) * 200;
  return Math.min(roundP(Math.pow(base, 1.04) * (1 + 0.3 * (copa ? 1 : 0))), neutro ? Math.max(capacidade(A), capacidade(B), 50000) : capacidade(A));
}
function atualizaIndice(m, temporada) {
  const r1 = R(), r2 = R(), r3 = R();
  m += (temporada % 100 < 50) ? 0.01 * (r1 + r2 - r3) : 0.01 * (r1 - r2 - r3);
  return Math.max(Math.min(m, 10), 0.5);
}
function lancar(t, valor, conta) { t.caixa += valor; t.contas[conta] = (t.contas[conta] || 0) + valor; }

// ------------------------------------------------------------------ criacao de jogo (doc 05)
function novoJogador(id, nome, pos, nac, f) {
  return Object.assign({ id, nome, pos, nac, f, papel: 0, c: 0, susp: 0, les: 0, sal: 50, gols: 0, golsTemp: 0, reneg: false, jogos: 0 },
                       atributosDoNome(nome, pos));
}

function cotasDosPaises(equipas, paises, rng) {
  // 1028:1604 conta os times de cada pais; 1028:1b95 corta ao acaso ate 128 times, tirando mais dos paises grandes
  const cota = {}; for (const e of equipas) if (paises.includes(e.p)) cota[e.p] = (cota[e.p] || 0) + 1;
  let total = Object.values(cota).reduce((a, b) => a + b, 0);
  const lista = Object.keys(cota);
  while (total > 128) { const p = lista[rng.n(lista.length)]; if (cota[p] > 0 && rng.n(128) < cota[p]) { cota[p]--; total--; } }
  return cota;
}

function criarJogo(equipas, paises, idHumano, nomeTreinador, seed, opcoes) {
  opcoes = opcoes || {};
  if (!Array.isArray(paises)) paises = [paises];
  usarMoeda(opcoes.moeda || "escudos");
  R = criarRng(seed || (Date.now() & 0x7fffffff));
  // 1020:367a: forca de 20 a 1; dentro da mesma forca, na ordem dos arquivos; respeitando a cota de cada pais
  const cota = cotasDosPaises(equipas, paises, R);
  const lista = [];
  for (let f = 20; f >= 0; f--) equipas.forEach((e, k) => {
    if ((f === 0 ? e.f <= 0 : e.f === f) && cota[e.p] > 0) { cota[e.p]--; lista.push({ e, k }); }
  });
  if (idHumano != null && !lista.some(o => o.k === idHumano)) {      // garante o clube escolhido
    const e = equipas[idHumano]; if (e) { lista.pop(); lista.push({ e, k: idHumano }); lista.sort((a, b) => b.e.f - a.e.f || a.k - b.k); }
  }
  const pais = paises.slice().sort((a, b) => equipas.filter(e => e.p === b).length - equipas.filter(e => e.p === a).length)[0];
  let pid = 1;
  const times = lista.map(({ e, k }, i) => {
    const L = nivelPorPosicao(i);
    const t = { id: k, nome: e.n, curto: e.c, pais: e.p, cor: e.cor || [40, 90, 160, 255, 255, 255], treinador: e.tr || "",
      L, estadio: Math.max(1, roundP(0.3 * L)), caixa: L * 50000 * MOEDA.s, divida: 0, X: 1.0, fator: 1.0,
      formacao: "4-4-2", manual: false, contas: {}, jog: [], hist: [], ocup: 0, tj: 0 };
    for (const [nome, pos, nac] of e.j) t.jog.push(novoJogador(pid++, nome, pos, nac, forcaJogador(L)));
    return t;
  });
  const nDiv = Math.min(4, Math.floor(times.length / 8));
  const divisoes = [];
  for (let d = 0; d < nDiv; d++) divisoes.push(times.slice(8 * d, 8 * d + 8).map(t => t.id));
  divisoes.push(times.slice(8 * nDiv).map(t => t.id));       // Distrital (resto)
  const humano = idHumano != null ? idHumano : times[times.length - 1].id;
  const st = { versao: 3, paises, arbitros: (opcoes.arbitros && opcoes.arbitros.length ? opcoes.arbitros : arbitrosFicticios()).map(([p, n]) => ({ pais: p, nome: n })), moeda: opcoes.moeda || "escudos", demissoes: opcoes.demissoes !== false, carreira: [], demitido: null, observados: [], pais, temporada: 0, rodada: 0, m: 2.0, pf: 1.0, ano0: opcoes.ano || new Date().getFullYear(), times, divisoes, nDiv, humano, treinador: nomeTreinador || "Treinador",
    copa: { vivos: [], fase: "", campeao: null }, aVenda: [], lances: {}, noticias: [], historico: [], pedidos: [], ultimaRodada: null,
    proximoId: pid, rng: 0 };
  st.times.forEach(t => t.jog.forEach(j => j.sal = salario(j.f, t.X, st.m)));      // indice inicial 2.0 (validado: salario 8 -> 4000 reais)
  // ate 6 treinadores humanos (dialogo "Jogadores" do original); sem clube escolhido, "Sortear equipas" sorteia na ultima divisao [?]
  const pedidosH = (opcoes.humanos && opcoes.humanos.length ? opcoes.humanos : [{ nome: st.treinador, id: humano }]).slice(0, 6);
  const sorteio = embaralhar(st.divisoes[Math.max(0, nDiv - 1)].slice());
  st.humanos = []; st.vez = 0;
  pedidosH.forEach((h, k) => {
    let id = h.id != null && times.some(t => t.id === h.id) && !st.humanos.some(q => q.id === h.id) ? h.id : null;
    if (id == null) id = sorteio.find(x => !st.humanos.some(q => q.id === x) && !pedidosH.some(q => q.id === x));
    const th = timePorId(st, id); th.manual = true; th.dono = k; th.treinadorAI = th.treinador; th.treinador = h.nome || `Treinador ${k + 1}`;
    st.humanos.push({ id, treinador: th.treinador, carreira: [{ temp: 1, time: th.curto, evento: "Contratado" }], demitido: null, pedidos: [], lances: {}, observados: [], fimDeTemporada: null });
  });
  carregarVez(st, 0);
  iniciarTemporada(st);
  st.rng = R.estado();
  return st;
}

const timePorId = (st, id) => st.times.find(t => t.id === id);
const divisaoDe = (st, id) => st.divisoes.findIndex(d => d.includes(id));
const ehHumano = (st, t) => t.dono != null || t.id === st.humano;
// ---- varios treinadores humanos: o "da vez" fica nos campos de st; os outros, em st.humanos[k]
const CAMPOS_VEZ = ["treinador", "carreira", "demitido", "pedidos", "lances", "observados", "fimDeTemporada"];
function guardarVez(st) { if (!st.humanos) return; const h = st.humanos[st.vez]; h.id = st.humano; for (const c of CAMPOS_VEZ) h[c] = st[c]; }
function carregarVez(st, k) { const h = st.humanos[k]; st.vez = k; st.humano = h.id; for (const c of CAMPOS_VEZ) st[c] = h[c]; }
function trocarVez(st, k) { if (!st.humanos || k === st.vez || !st.humanos[k]) return; guardarVez(st); carregarVez(st, k); }
function comHumano(st, k, fn) { if (!st.humanos || k == null || k === st.vez) return fn(); const v = st.vez; trocarVez(st, k); try { return fn(); } finally { trocarVez(st, v); } }
const vagaDe = (st, t) => (t.dono == null || !st.humanos || t.dono === st.vez) ? st : st.humanos[t.dono];

// ------------------------------------------------------------------ arbitros (docs 11, 20)
function arbitrosFicticios() {
  const n = ["Abílio", "Bernardo", "Custódio", "Damião", "Ezequiel", "Firmino", "Gaspar", "Hilário", "Isidro", "Lourenço", "Matias", "Nicolau", "Olegário", "Plácido", "Romão", "Sebastião", "Teodoro", "Valdemar"];
  const a = ["Arruda", "Bragança", "Corte-Real", "Dourado", "Espinheira", "Figueiredo", "Granja", "Lacerda", "Meireles", "Nogueira", "Pimentel", "Resende", "Saraiva", "Tojal", "Veloso", "Zamith"];
  const out = []; for (let i = 0; i < n.length; i++) for (let k = 0; k < 3; k++) out.push(["POR", n[i] + " " + a[(i * 3 + k * 5) % a.length]]);
  return out;
}
function afinidade(ref, t) {                                                                   // 1010:c95c
  const a = ref.nome, b = t.curto, n = Math.max(a.length, b.length);
  let soma = 0;
  for (let i = n; i >= 1; i--) soma += (i <= a.length ? Math.min(a.charCodeAt(i - 1), 255) : 0) - (i <= b.length ? Math.min(b.charCodeAt(i - 1), 255) : 0);
  let v = Math.abs(soma % 11);
  if (ref.pais === t.pais) v += 3;
  return v;
}

// ------------------------------------------------------------------ calendario (doc 13)
function tabelaTurnoReturno(n) {
  let arr = [...Array(n).keys()]; const turno = [];
  for (let r = 0; r < n - 1; r++) {
    const rod = [];
    for (let k = 0; k < n / 2; k++) { const a = arr[k], b = arr[n - 1 - k]; rod.push((r + k) % 2 === 0 ? [a, b] : [b, a]); }
    turno.push(rod); arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
  }
  return turno.concat(turno.map(rod => rod.map(([a, b]) => [b, a])));
}
// Matriz do original (DS:0x17c8, lida na memoria do jogo: equipa+0x22..+0x2f). Linha = posicao do time na divisao no
// inicio da temporada; na rodada r os times sao ordenados pelo numero da coluna r e jogam (1,2) (3,4) (5,6) (7,8), o
// primeiro em casa. Conferido com as rodadas 1 a 7 e os calendarios do Cagliari e do Brescia no original.
const MATRIZ = [
  [3, 4, 5, 8, 2, 6, 7, 4, 3, 6, 7, 1, 5, 8],
  [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
  [4, 5, 8, 1, 7, 3, 6, 3, 6, 7, 2, 8, 4, 5],
  [5, 8, 2, 7, 6, 4, 3, 6, 7, 1, 8, 5, 3, 4],
  [8, 1, 7, 6, 3, 5, 4, 7, 2, 8, 5, 4, 6, 3],
  [2, 7, 6, 3, 4, 8, 5, 1, 8, 5, 4, 3, 7, 6],
  [7, 6, 3, 4, 5, 1, 8, 8, 5, 4, 3, 6, 2, 7],
  [6, 3, 4, 5, 8, 7, 2, 5, 4, 3, 6, 7, 8, 1]];
const TABELA = MATRIZ[0].map((_, r) => {
  const ord = [0, 1, 2, 3, 4, 5, 6, 7].sort((a, b) => MATRIZ[a][r] - MATRIZ[b][r]);
  return [[ord[0], ord[1]], [ord[2], ord[3]], [ord[4], ord[5]], [ord[6], ord[7]]];
});

function iniciarTemporada(st) {
  st.temporada += 1; st.rodada = 0;
  st.ordem = st.divisoes.slice(0, st.nDiv).map(d => d.slice());      // indice na tabela = posicao no inicio
  st.refCaixa = st.divisoes.slice(0, st.nDiv).map(d => Math.max(1, d.reduce((a, id) => a + timePorId(st, id).caixa, 0)));
  for (const t of st.times) {
    t.pts = t.v = t.e = t.d = t.gp = t.gc = 0; t.contas = {}; t.cal = [];
    for (const j of t.jog) { j.reneg = false; j.golsTemp = 0; }
  }
  st.copa = { vivos: st.times.map(t => t.id), fase: "", campeao: null, jogos: [] };
  embaralhar(st.copa.vivos);
}
function embaralhar(a) { for (let i = a.length - 1; i > 0; i--) { const k = R.n(i + 1); [a[i], a[k]] = [a[k], a[i]]; } return a; }

// ------------------------------------------------------------------ partida (docs 03, 07, 14, 18)
function escalarComputador(t) {
  // 1010:4388: embaralha o elenco (desempate ao acaso), escala o minimo 1-3-3-2 com os melhores de cada posicao,
  // completa as 2 vagas com os melhores de qualquer posicao (ate 10 por setor) e poe ate 5 no banco
  for (const j of t.jog) j.papel = 0;
  const aptos = embaralhar(t.jog.filter(j => !j.les && !j.susp)).sort((a, b) => b.f - a.f);
  const minimo = [1, 3, 3, 2];
  for (let p = 0; p < 4; p++) aptos.filter(j => j.pos === p).slice(0, minimo[p]).forEach(j => j.papel = 1);
  const nTit = () => t.jog.filter(j => j.papel === 1).length;
  for (const j of aptos) { if (nTit() >= 11) break; if (j.papel === 0 && j.pos > 0) j.papel = 1; }
  for (const j of aptos) { if (nTit() >= 11) break; if (j.papel === 0) j.papel = 1; }
  aptos.filter(j => j.papel === 0).slice(0, 5).forEach(j => j.papel = 2);
  t.trocas = Math.min(t.jog.filter(j => j.papel === 2).length, 3);
}

function escalarMelhores(t) {                                                                   // menu Seleccionar > Melhores
  for (const j of t.jog) j.papel = 0;
  const ord = t.jog.filter(j => !j.les && !j.susp).sort((a, b) => b.f - a.f);
  const gr = ord.find(j => j.pos === 0); if (gr) gr.papel = 1;
  ord.filter(j => j.pos > 0).slice(0, 10).forEach(j => j.papel = 1);
  ord.filter(j => j.papel === 0).slice(0, 5).forEach(j => j.papel = 2);
  t.trocas = Math.min(t.jog.filter(j => j.papel === 2).length, 3);
}

function escalar(t, computador) {
  if (computador || t.formacao === "auto") return escalarComputador(t);
  if (t.formacao === "melhores") return escalarMelhores(t);
  const f = FORMACOES[t.formacao] || FORMACOES["4-4-2"];
  for (const j of t.jog) j.papel = 0;
  const aptos = t.jog.filter(j => !j.les && !j.susp);
  if (t.manual && t.escalacao) {
    const tit = t.escalacao.tit.map(id => aptos.find(j => j.id === id)).filter(Boolean);
    tit.slice(0, 11).forEach(j => j.papel = 1);
    t.escalacao.banco.map(id => aptos.find(j => j.id === id && j.papel === 0)).filter(Boolean).slice(0, 5).forEach(j => j.papel = 2);
  }
  const ord = aptos.slice().sort((a, b) => b.f - a.f);
  const nTit = () => t.jog.filter(j => j.papel === 1).length;
  if (nTit() < 11) {
    for (let p = 0; p < 4; p++) {
      const ja = t.jog.filter(j => j.papel === 1 && j.pos === p).length;
      ord.filter(j => j.pos === p && j.papel === 0).slice(0, Math.max(0, f[p] - ja)).forEach(j => j.papel = 1);
    }
    ord.filter(j => j.papel === 0 && j.pos > 0).slice(0, Math.max(0, 11 - nTit())).forEach(j => j.papel = 1);
  }
  const banco = t.jog.filter(j => j.papel === 2).length;
  ord.filter(j => j.papel === 0).slice(0, Math.max(0, 5 - banco)).forEach(j => j.papel = 2);
  t.trocas = Math.min(t.jog.filter(j => j.papel === 2).length, 3);
}

function setores(t) {
  const s = [0, 0, 0, 0];
  for (const j of t.jog) if (j.papel === 1) s[j.pos] += 3 * (j.nac === t.pais ? 1 : 0) + j.f + 2 * j.estrela;
  [t.GK, t.DEF, t.MID, t.ATT] = s;
}

function poderDeGol(A, B) {                                                                    // doc 03
  let S = 0;
  for (const [sa, sb, w] of [[A.DEF, B.ATT, 1], [A.MID, B.MID, 2], [A.ATT, 3 * B.GK + B.DEF, 1]]) {
    const a = 1 + sa, b = 1 + sb; S += w * a / (a + b + 1);
  }
  const P = 4 * (A.ATT + A.MID / 2), D = 3 * B.GK + B.DEF + B.MID / 2 + 1;
  return S * Math.log(1 + P / D) * Math.pow(A.fator / 2, 0.25);
}

function ponderado(t, peso) {
  const tit = t.jog.filter(j => j.papel === 1);
  const tot = tit.reduce((a, j) => a + peso(j), 0);
  if (tot <= 0) return null;
  let r = R.n(tot), acc = 0;
  for (const j of tit) { acc += peso(j); if (acc > r) return j; }
  return null;
}

function substituir(t, sai, modo) {
  if (t.trocas <= 0) return null;
  const gk = sai.pos === 0; let entra = null;
  if (modo === 0) entra = t.jog.find(j => j.papel === 2 && (j.pos === 0) === gk);
  else {
    if (!gk) return null;
    entra = t.jog.find(j => j.papel === 2 && j.pos === 0);
    if (entra) sai = t.jog.slice(1).reverse().find(j => j.papel === 1) || null;
  }
  if (entra && sai) { sai.papel = 0; entra.papel = 1; t.trocas -= 1; return [sai, entra]; }
  return null;
}

const valorBatedor = (j) => roundP((j.pos + 1) * j.f * (j.h / 10 + 1) / 2);
function cobranca(batedor, gr) {                                                               // doc 18 (81ed)
  const a = R.n(Math.max(valorBatedor(batedor), 1)), b = R.n(Math.max(gr ? gr.f : 1, 1));
  if (R.n(4) === 0 && a < 13) return a < 4 ? "para fora" : a < 10 ? "por cima" : a < 12 ? "no travessão" : "na trave";
  return a >= b ? "gol" : "defesa";
}

function iniciarPartida(st, A, B, tipo, ref, neutro) {
  // tipo 0 campeonato, 1 taca; neutro = final da taca em campo neutro [?]: sem o +2 de mandante no arbitro e sem vantagem de casa no golo
  for (const t of [A, B]) { escalar(t, !ehHumano(st, t)); setores(t); t.gj = 0; t.anul = 0; }
  if (!ref) ref = st.arbitros && st.arbitros.length ? st.arbitros[R.n(st.arbitros.length)] : { nome: "", pais: "" };
  return { A, B, tipo, neutro: !!neutro, x: [(neutro ? 0 : 2) + afinidade(ref, A), afinidade(ref, B)], arbitro: ref, ev: [], m: 0,
    manual: [ehHumano(st, A), ehHumano(st, B)] };    // 1010:8db2
}

function minutoPartida(pm) {
  if (pm.pendente) { const t = pm.pendente.lado ? pm.B : pm.A, sa = t.jog.find(j => j.id === pm.pendente.sai), gk = sa && sa.pos === 0, e = t.jog.find(j => j.papel === 2 && (j.pos === 0) === gk) || t.jog.find(j => j.papel === 2); substituirLesionado(pm, e ? e.id : -1); }
  const { A, B, x, ev } = pm; const m = ++pm.m;
  const nome = (j) => j ? j.nome : "?";
    let ultimo = null;
    // penalti (a6eb)
    for (let lado = 0; lado < 2 && !ultimo; lado++) {
      const t = lado ? B : A, o = lado ? A : B;
      if (R.n(lado ? 7000 : 6000) < x[lado]) {
        const bat = t.jog.filter(j => j.papel === 1).sort((p, q) => valorBatedor(q) - valorBatedor(p))[0];
        const gr = o.jog.find(j => j.papel === 1 && j.pos === 0);
        if (bat) {
          let res = cobranca(bat, gr);
          if (res === "defesa" && R.n(3) === 0) {                     // repeticao (Random(3), doc 18) [?] condicao exata nao lida
            ev.push({ m, lado, tipo: "info", txt: `${nome(gr)} defende o pênalti, mas o árbitro manda repetir` });
            res = cobranca(bat, gr);
          }
          if (res === "gol") { t.gj++; bat.gols++; bat.golsTemp++; ultimo = [t, bat]; ev.push({ m, lado, tipo: "gol", txt: `${nome(bat)} (pên.)` }); }
          else ev.push({ m, lado, tipo: "info", txt: `Pênalti perdido por ${nome(bat)}: ${res}` });
        }
      }
    }
    // golo (doc 03)
    if (!ultimo) for (let lado = 0; lado < 2; lado++) {
      const t = lado ? B : A, o = lado ? A : B;
      const G = poderDeGol(t, o);
      const [d1, d2] = pm.neutro ? [105, 225] : lado ? [120, 270] : [90, 180];
      if (((G - (t.gj + t.anul) > R.n(d1)) || R.n(d2) === 0) && m > R.n(45)) {
        const art = ponderado(t, j => j.pos * j.pos * j.f * j.h);
        t.gj++; if (art) { art.gols++; art.golsTemp++; }
        ultimo = [t, art]; ev.push({ m, lado, tipo: "gol", txt: nome(art) });
        break;
      }
    }
    let mudou = false;
    // expulsao (aa11)
    for (let lado = 0; lado < 2; lado++) {
      const t = lado ? B : A, r = R.n(1000);
      if (r < 10 && r > x[lado]) {
        const j = ponderado(t, q => q.t);
        if (j && j.t > 0) {
          j.papel = 0; j.susp = R.n(4) + 1; j.verm = (j.verm || 0) + 1; mudou = true;
          ev.push({ m, lado, tipo: "vermelho", txt: `${j.nome} expulso (${j.susp} jogo${j.susp > 1 ? "s" : ""})` });
          const s = substituir(t, j, 1); if (s) ev.push({ m, lado, tipo: "troca", txt: `Entra ${s[1].nome}, sai ${s[0].nome}` });
        }
      }
    }
    // lesao (ac72)
    const r = R.n(500);
    if (r < 2) {
      const t = r ? B : A, j = ponderado(t, q => q.g);
      if (j && j.g > 0) {
        j.papel = 0; j.les = R.n(R.n(20)) + 1; j.f = Math.max(j.f - 10, 1); j.nles = (j.nles || 0) + 1; mudou = true;
        ev.push({ m, lado: r, tipo: "lesao", txt: `${j.nome} lesionado (${j.les} jogo${j.les > 1 ? "s" : ""})`, jog: j.id });
        // time humano: o original obriga a escolher quem entra (dialogo); o motor deixa pendente para a interface
        if (pm.manual && pm.manual[r] && t.trocas > 0 && t.jog.some(q => q.papel === 2)) pm.pendente = { lado: r, sai: j.id, m };
        else { const s = substituir(t, j, 0); if (s) ev.push({ m, lado: r, tipo: "troca", txt: `Entra ${s[1].nome}, sai ${s[0].nome}` }); }
      }
    }
    if (mudou) { setores(A); setores(B); }
    // golo anulado (aea7)
    if (ultimo) {
      const r2 = R.n(200);
      if (r2 < 10 && r2 > x[0]) {
        const [t, art] = ultimo; t.gj--; t.anul++; if (art) { art.gols--; art.golsTemp--; }
        const e = ev.filter(q => q.tipo === "gol" && q.m === m).pop(); if (e) { e.tipo = "anulado"; e.txt += " — anulado"; }
      }
    }
    // contador de minutos (doc 07)
    for (const t of [A, B]) if (t.jog.length) { const j = t.jog[R.n(t.jog.length)]; j.c += j.papel === 1 ? -1 : 1; }
  }

function fecharPartida(pm) {
  const { A, B } = pm;
  for (const t of [A, B]) for (const j of t.jog) if (j.papel === 1) j.jogos++;
  return { casa: A.id, fora: B.id, gc: A.gj, gf: B.gj, ev: pm.ev, tipo: pm.tipo };
}

function jogarPartida(st, A, B, tipo) {
  const pm = iniciarPartida(st, A, B, tipo);
  while (pm.m < 90) minutoPartida(pm);
  return fecharPartida(pm);
}

function penaltisDesempate(st, A, B, jogo) {
  // o original mostra cobranca a cobranca tambem entre dois times do computador (visto nos 64 avos); o atalho do doc 14 fica desligado
  const opc = st.opcoes || {};
  if (opc.verDesempates === false && !(ehHumano(st, A) || ehHumano(st, B)) && st.copa.vivos.length > 2) {
    const fa = mediaForca(A), fb = mediaForca(B);
    const sa = R.n(fa) + R.n(fa) + R.n(fa), sb = R.n(fb) + R.n(fb) + R.n(fb);
    jogo.pen = sa >= sb ? "casa" : "fora"; jogo.penTxt = "nos pênaltis"; return sa >= sb ? A : B;
  }
  const bat = (t) => t.jog.filter(j => j.papel === 1).sort((p, q) => valorBatedor(q) - valorBatedor(p));
  const ba = bat(A), bb = bat(B), ga = A.jog.find(j => j.papel === 1 && j.pos === 0), gb = B.jog.find(j => j.papel === 1 && j.pos === 0);
  // 5 cobrancas alternadas, encerrando assim que um lado nao pode mais alcancar (visto no original: 4:1 apos 4 x 3); depois morte subita
  let pa = 0, pb = 0, k = 0; const cob = jogo.cobrancas = [];
  for (; k < 5; k++) {
    const ra = cobranca(ba[k % ba.length], gb); if (ra === "gol") pa++; cob.push([0, ba[k % ba.length].nome, ra]);
    if (pa > pb + (5 - k) || pb > pa + (5 - k - 1)) break;
    const rb = cobranca(bb[k % bb.length], ga); if (rb === "gol") pb++; cob.push([1, bb[k % bb.length].nome, rb]);
    if (pa > pb + (5 - k - 1) || pb > pa + (5 - k - 1)) break;
  }
  while (pa === pb) {
    k++; const ra = cobranca(ba[k % ba.length], gb), rb = cobranca(bb[k % bb.length], ga);
    if (ra === "gol") pa++; if (rb === "gol") pb++; cob.push([0, ba[k % ba.length].nome, ra], [1, bb[k % bb.length].nome, rb]);
    if (k > 40) { pa += 1; break; }
  }
  jogo.pen = pa > pb ? "casa" : "fora"; jogo.penTxt = `${pa}-${pb} nos pênaltis`;
  return pa > pb ? A : B;
}

function posJogo(st, t, rodada) {
  for (const j of t.jog) { if (j.susp) j.susp--; if (j.les) j.les--; }
  lancar(t, -folha(t), "salarios");
  lancar(t, -juros(t.divida), "juros");
  renegociar(st, t, rodada);
}

function renegociar(st, t, rodada) {                                                           // doc 18
  if (rodada <= 1) return;
  const cand = t.jog.filter(j => !j.reneg).map(j => ({ j, novo: salario(j.f, t.X, st.m) })).map(o => (o.r = o.novo / Math.max(o.j.sal, 1), o));
  if (!cand.length) return;
  if (ehHumano(st, t)) {
    const p = cand.filter(o => o.r > 1.3 && o.novo - o.j.sal > 300).sort((a, b) => b.r - a.r)[0];
    const vg = vagaDe(st, t);
    if (p && !vg.pedidos.some(q => q.id === p.j.id)) { p.j.reneg = true; vg.pedidos.push({ id: p.j.id, pedido: salarioPedido(p.novo, rodada), atual: p.j.sal }); }
    const baixo = cand.filter(o => o.r < 1.0).sort((a, b) => a.r - b.r)[0];
    if (baixo) { baixo.j.sal = baixo.novo; baixo.j.reneg = true; }
    return;
  }
  const lo = cand.filter(o => o.r < 1.2).sort((a, b) => a.r - b.r)[0];
  const hi = cand.filter(o => o.r > 0.8).sort((a, b) => b.r - a.r)[0];
  for (const o of [lo, hi]) if (o && !o.j.reneg) { o.j.sal = o.novo; o.j.reneg = true; }
}

// ------------------------------------------------------------------ mercado (doc 17)
const media = mediaForca;
const faixa = (t) => Math.min(Math.floor(media(t) / 10), 5);
const contaPos = (t, p) => t.jog.filter(j => j.pos === p).length;
const estrangeiros = (t) => t.jog.filter(j => categoria(j.nac, t.pais) === 2).length;
function utilidade(t, j) {
  const fx = faixa(t);
  let u = Math.pow(5 / (j.t + 1), 0.25) * COTA[fx][j.pos] / (contaPos(t, j.pos) + 1) * COTA[fx][5] / (t.jog.length + 1) * j.f / (media(t) + 1);
  const c = categoria(j.nac, t.pais); return u * (c === 0 ? 1.5 : c === 1 ? 1.2 : 1);
}
// 1010:5a6a (validado no original): elenco com mais de 11; nao suspenso nem lesionado; nao renovado/contratado nesta
// temporada (+0x16); goleiro so se houver outro; jogador de linha so se sobrarem mais de 10 de linha
function motivoNaoSai(t, j) {
  if (t.jog.length <= 11) return "o elenco ficaria com menos de 11 jogadores";
  if (j.susp) return "ele está suspenso";
  if (j.reneg) return "ele já foi contratado ou renovou nesta temporada";
  if (j.les) return "ele está lesionado";
  if (j.pos === 0 && contaPos(t, 0) <= 1) return "é o único goleiro";
  if (j.pos !== 0 && t.jog.length - contaPos(t, 0) <= 10) return "sobrariam menos de 10 jogadores de linha";
  return "";
}
const podeSair = (t, j) => !motivoNaoSai(t, j);
function interesse(B, j) {
  const av = media(B), fx = faixa(B);
  let i = (j.f / (av + 5)) * (COTA[fx][j.pos] + 1) / (contaPos(B, j.pos) + 1) * COTA[fx][5] / (B.jog.length + 1);
  i = Math.pow(i, 0.25) * Math.pow(Math.max(av, 1), 0.1);
  if (j.pos === 0 && contaPos(B, 0) === 1) i *= 1.5;
  const c = categoria(j.nac, B.pais), e = estrangeiros(B);
  let k = c === 0 ? 1.5 + 0.05 * e : c === 1 ? 1.15 + 0.05 * e : 1;
  if (j.estrela) k *= 1.1;
  return i * k;
}
function elegivel(B, j) {
  if (B.jog.length >= 24) return false;
  if (estrangeiros(B) >= 5 && categoria(j.nac, B.pais) === 2) return false;
  return true;
}
function oferta(st, B, j) {
  if (COTA[faixa(B)][j.pos] === contaPos(B, j.pos)) return 0;
  const sal = salario(j.f, B.X, st.m);
  let V = precoJogador(j, st.m) * interesse(B, j);
  const P = folha(B), Rz = (B.caixa - V) / (P + 1 + sal);
  if (Rz < 3) V = B.caixa - 3 * (P + sal); else if (Rz > 5) V = V * Math.log(Rz) / 1.6;
  if (P > 100 && B.caixa - V > 10 * P && B.caixa - V > 1) V = V * (Math.log((B.caixa - V) / P - 9) / 10 + 1);
  const of = Math.max(0, Math.min(roundP(B.caixa - V - 5 * P), roundP(V)));
  return Math.floor(of / 1000) * 1000;
}

function transferir(st, vendedor, j, comprador, valor) {
  vendedor.jog = vendedor.jog.filter(q => q !== j); comprador.jog.push(j);
  j.sal = salario(j.f, comprador.X, st.m); j.papel = 0; j.reneg = true;
  lancar(vendedor, valor, "vendas"); lancar(comprador, -valor, "compras");
  for (const t of [vendedor, comprador]) if (t.escalacao) { t.escalacao.tit = t.escalacao.tit.filter(id => id !== j.id); t.escalacao.banco = t.escalacao.banco.filter(id => id !== j.id); }
  st.historico.unshift({ temp: st.temporada, rod: st.rodada, nome: j.nome, de: vendedor.curto, para: comprador.curto, valor });
  st.historico = st.historico.slice(0, 60);
  st.nTransf = (st.nTransf || 0) + 1;
  if (ehHumano(st, vendedor)) noticia(st, `${j.nome} vendido para o ${comprador.curto} por ${dinheiro(valor)}.`);
  if (ehHumano(st, comprador)) noticia(st, `${j.nome} contratado do ${vendedor.curto} por ${dinheiro(valor)}.`);
}

function leilao(st, vendedor, j, minimo, lanceHumano, idLicitante) {
  let melhor = null, comprador = null;
  for (const B of st.times) {
    if (B === vendedor || ehHumano(st, B) || !elegivel(B, j) || B.caixa < minimo) continue;
    const of = oferta(st, B, j);
    if (of >= minimo && (melhor === null || of > melhor)) { melhor = of; comprador = B; }
  }
  const H = timePorId(st, idLicitante != null ? idLicitante : st.humano);
  if (lanceHumano && H !== vendedor && lanceHumano >= minimo && (melhor === null || lanceHumano > melhor) && elegivel(H, j) && H.caixa >= lanceHumano) {
    melhor = lanceHumano; comprador = H;
  }
  if (!comprador) return null;
  transferir(st, vendedor, j, comprador, melhor);
  return { comprador, valor: melhor };
}

function decidirVenda(st, t, rodada) {
  if (ehHumano(st, t)) {
    if (t.caixa < 0) {
      const cand = t.jog.filter(j => podeSair(t, j)); if (!cand.length) return;
      const j = cand.reduce((a, b) => utilidade(t, a) <= utilidade(t, b) ? a : b);
      const r = leilao(st, t, j, 0); if (r) noticia(st, `Caixa negativo: ${j.nome} foi vendido à força para o ${r.comprador.curto}.`);
    }
    return;
  }
  const cand = t.jog.filter(j => podeSair(t, j)); if (!cand.length) return;
  if (t.caixa < 0) { leilao(st, t, cand.reduce((a, b) => utilidade(t, a) <= utilidade(t, b) ? a : b), 0); return; }
  if (rodada <= 1) return;
  const cheio = estrangeiros(t) === 5, aperto = t.caixa * 3 < folha(t);       // 1010:3aad
  if (aperto || R.n(20) === 0 || (cheio && t.jog.length >= 21)) {
    // com a cota de 5 estrangeiros cheia, so um estrangeiro pode ser posto a venda (validado: todas as vendas vistas eram de estrangeiros)
    const lista = cheio ? cand.filter(q => categoria(q.nac, t.pais) === 2) : cand; if (!lista.length) return;
    const j = lista.reduce((a, b) => utilidade(t, a) <= utilidade(t, b) ? a : b);
    const minimo = Math.floor(roundP(precoJogador(j, st.m) * 1.6 * (st.pf || 1)) / 1000) * 1000;      // 1010:3aad: preco * 1.6 * DS:2b50
    if (!st.aVenda.some(a => a.id === j.id)) st.aVenda.push({ id: j.id, time: t.id, minimo, rod: rodada, temp: st.temporada });
  }
}

// leiloes do computador, um a um (dialogo "Venda de jogador por leilao" do original)
function leiloesPendentes(st) {
  return st.aVenda.map(a => { const t = timePorId(st, a.time), j = t && t.jog.find(q => q.id === a.id); return j ? { a, t, j } : null; }).filter(Boolean);
}
function interesseHumano(st, j) { return interesse(timePorId(st, st.humano), j); }
function resolverLeilao(st, idJog, lance) {
  R.definir(st.rng);
  const k = st.aVenda.findIndex(a => a.id === idJog); if (k < 0) return null;
  const a = st.aVenda.splice(k, 1)[0], t = timePorId(st, a.time), j = t && t.jog.find(q => q.id === a.id);
  if (!j) return null;
  const H = timePorId(st, st.humano);
  let r = null;
  if (lance && lance > H.caixa) lance = 0;
  r = leilao(st, t, j, a.minimo, lance || 0, st.humano);
  st.rng = R.estado();
  return r ? { comprador: r.comprador, valor: r.valor, jogador: j, vendedor: t } : { comprador: null, jogador: j, vendedor: t };
}
function resolverMercado(st) {
  const lista = st.aVenda; st.aVenda = [];
  for (const a of lista) {
    const t = timePorId(st, a.time); const j = t && t.jog.find(q => q.id === a.id);
    if (!j) continue;
    guardarVez(st);
    const vagas = st.humanos || [{ id: st.humano, lances: st.lances, treinador: st.treinador }];
    let lance = 0, quem = null;
    for (const h of vagas) { const v = (h.lances || {})[a.id] || 0; if (v > lance && h.id !== t.id) { lance = v; quem = h; } }
    const r = leilao(st, t, j, a.minimo, lance, quem ? quem.id : null);
    for (const h of vagas) if ((h.lances || {})[a.id] && (!r || r.comprador.id !== h.id)) noticia(st, `Lance de ${h.treinador} por ${j.nome} foi superado${r ? " pelo " + r.comprador.curto : ""}.`);
  }
  st.lances = {}; if (st.humanos) st.humanos.forEach(h => h.lances = {}); guardarVez(st);
}

function gerirFinancas(st, t) {                                                                // doc 09 (computador)
  if (ehHumano(st, t)) return;
  const lim = limiteEmprestimo(t, st.m);
  while (t.divida > 0 && t.caixa - folha(t) - juros(t.divida) > 0) {
    const pago = Math.min(t.divida, t.caixa - folha(t) - juros(t.divida)); t.divida -= pago; t.caixa -= pago;
  }
  while (t.caixa < folha(t) + juros(t.divida) && t.divida < lim) {
    const v = Math.min(lim - t.divida, Math.max(folha(t), MOEDA.q)); t.divida += v; t.caixa += v;
  }
}

// ------------------------------------------------------------------ rodada
function noticia(st, txt) { st.noticias.unshift({ temp: st.temporada, rod: st.rodada, txt }); st.noticias = st.noticias.slice(0, 80); }
function dinheiro(v) { return Math.round(v).toLocaleString("pt-BR") + MOEDA.sufixo; }

function anotarCal(t, r, adv, casa, gp, gc, pub, copa) { (t.cal || (t.cal = [])).push({ r, adv: adv.id, casa, gp, gc, pub, copa: copa || null }); }
function registrar(t, gp, gc) {
  t.gp += gp; t.gc += gc;
  if (gp > gc) { t.v++; t.pts += 3; } else if (gp === gc) { t.e++; t.pts++; } else t.d++;
}

function aposJogo(st, t, gp, gc, emCasa, rodada) {
  // moral (1010:9396 + 1068:10d1): media movel com peso 0.85; vitoria 2, derrota 0, empate 0.8 em casa / 1.3 fora
  const alvo = gp > gc ? 2 : gp < gc ? 0 : (emCasa ? 0.8 : 1.3);
  t.fator = 0.85 * t.fator + 0.15 * alvo;
  t.tj = (t.tj || 0) + 1;
  verificarTreinador(st, t);
  posJogo(st, t, rodada);
  decidirVenda(st, t, rodada);
  if (!ehHumano(st, t) && podeAmpliar(t) && t.caixa > 2 * folha(t) + custoObra(t, st.m)) ampliar(st, t);
}

const copaDevida = (st, rodada) => rodada % 2 === 0 && st.copa.vivos.length > 1 && st.times.length > Math.pow(2, Math.floor((14 - rodada) / 2));
// proxima etapa: "liga" (jornada) ou "copa" (rodada propria da Taca, depois das jornadas pares - visto no original)
const proximaEtapa = (st) => st.copaPendente ? "copa" : "liga";
function iniciarRodada(st) {
  R.definir(st.rng);
  resolverMercado(st);
  if (st.copaPendente) {
    const rod = { rodada: st.rodada, temporada: st.temporada, fase: "copa", ativos: [], res: { rodada: st.rodada, temporada: st.temporada, divisoes: [], copa: null }, fim: false };
    st.arbAtual = embaralhar(st.arbitros.slice()); st.arbIdx = 0;
    iniciarCopa(st, rod);
    if (!rod.ativos.length) { st.copaPendente = false; fecharEtapaCopa(st, rod); }
    return rod;
  }
  st.rodada += 1; const rodada = st.rodada;
  st.arbAtual = embaralhar(st.arbitros.slice()); st.arbIdx = 0;
  const rod = { rodada, temporada: st.temporada, fase: "liga", ativos: [], res: { rodada, temporada: st.temporada, divisoes: [], copa: null }, fim: false };
  for (let d = 0; d < st.nDiv; d++) {
    const div = st.ordem[d].map(id => timePorId(st, id));
    const F = roundP(div.reduce((a, t) => a + mediaForca(t), 0) / div.length), X = div.reduce((a, t) => a + t.X, 0) / div.length;
    const preco = precoBilhete(F, X, st.m, false);
    for (const [c, f] of TABELA[rodada - 1]) { const pm = iniciarPartida(st, div[c], div[f], 0, proximoArbitro(st)); pm.d = d; pm.preco = preco; pm.publico = publico(div[c], div[f], false); rod.ativos.push(pm); }
  }
  if (!rod.ativos.length) fecharRodada(st, rod);
  return rod;
}
function fecharEtapaCopa(st, rod) {
  st.ultimaRodada = resumo(st, rod.res);
  if (rod.rodada === 14) fimTemporada(st);
  st.rng = R.estado();
  rod.fim = true; rod.ativos = [];
}

function proximoArbitro(st) { const l = st.arbAtual || st.arbitros; const r = l[(st.arbIdx || 0) % l.length]; st.arbIdx = (st.arbIdx || 0) + 1; return r; }

function minutoRodada(st, rod) {
  if (rod.fim) return;
  for (const pm of rod.ativos) minutoPartida(pm);
  if (rod.ativos[0].m < 90) return;
  if (rod.fase === "liga") { fecharLiga(st, rod); fecharRodada(st, rod); }
  else { fecharCopa(st, rod); st.copaPendente = false; fecharEtapaCopa(st, rod); }
}

function fecharLiga(st, rod) {
  const rodada = rod.rodada;
  for (let d = 0; d < st.nDiv; d++) rod.res.divisoes.push([]);
  for (const pm of rod.ativos) {
    const A = pm.A, B = pm.B, jogo = fecharPartida(pm);
    jogo.publico = pm.publico; jogo.renda = roundP(jogo.publico * pm.preco);
    anotarCal(A, rodada, B, true, jogo.gc, jogo.gf, jogo.publico, false); anotarCal(B, rodada, A, false, jogo.gf, jogo.gc, jogo.publico, false);
    A.ocup = 0.7 * (A.ocup || 0) + 0.3 * jogo.publico / (capacidade(A) + 1);        // 1010:c0c0
    lancar(A, jogo.renda, "bilheteira");
    registrar(A, jogo.gc, jogo.gf); registrar(B, jogo.gf, jogo.gc); anotarGoleada(st, A, B, jogo);
    aposJogo(st, A, jogo.gc, jogo.gf, true, rodada); aposJogo(st, B, jogo.gf, jogo.gc, false, rodada);
    rod.res.divisoes[pm.d].push(jogo);
  }
  rod.ativos = [];
}

function iniciarCopa(st, rod) {
  const rodada = rod.rodada, vivos = st.copa.vivos;
  rod.fase = "copa"; rod.ativos = [];
  if (!copaDevida(st, rodada)) return;
  if (!st.copa.sorteio) sortearCopa(st);
  const { fase, jogam, folga } = st.copa.sorteio; st.copa.sorteio = null;
  const tj = jogam.map(id => timePorId(st, id));
  const F = roundP(tj.reduce((a, t) => a + mediaForca(t), 0) / tj.length), X = tj.reduce((a, t) => a + t.X, 0) / tj.length;
  const preco = precoBilhete(F, X, st.m, true);
  rod.copaInfo = { fase, folga, preco };
  for (let k = 0; k < tj.length; k += 2) { const pm = iniciarPartida(st, tj[k], tj[k + 1], 1, proximoArbitro(st), fase === "Final"); pm.publico = publico(tj[k], tj[k + 1], true, pm.neutro); rod.ativos.push(pm); }
}

function sortearCopa(st) {          // o original mostra o adversario da Taca antes da rodada ("CASA TACA - 64 avos de final")
  const vivos = st.copa.vivos, n = vivos.length; let p = 1; while (p < n / 2) p *= 2;
  embaralhar(vivos);
  const fase = p === 1 ? "Final" : p <= 3 ? "Semifinais" : p <= 7 ? "Quartas de final" : p <= 15 ? "Oitavas de final" : `${p} avos de final`;
  st.copa.sorteio = { fase, jogam: vivos.slice(0, 2 * (n - p)), folga: vivos.slice(2 * (n - p)) };
}
function fecharCopa(st, rod) {
  const rodada = rod.rodada, { fase, folga, preco } = rod.copaInfo, seguem = [], jogos = [];
  for (const pm of rod.ativos) {
    const A = pm.A, B = pm.B, jogo = fecharPartida(pm);
    jogo.publico = pm.publico; jogo.renda = roundP(jogo.publico * preco / 2);
    anotarCal(A, rodada, B, true, jogo.gc, jogo.gf, jogo.publico, fase); anotarCal(B, rodada, A, false, jogo.gf, jogo.gc, jogo.publico, fase);
    if (pm.neutro) jogo.neutro = true; else A.ocup = 0.7 * (A.ocup || 0) + 0.3 * jogo.publico / (capacidade(A) + 1);
    lancar(A, jogo.renda, "bilheteira"); lancar(B, jogo.renda, "bilheteira");
    anotarGoleada(st, A, B, jogo);
    const venc = jogo.gc > jogo.gf ? A : jogo.gc < jogo.gf ? B : penaltisDesempate(st, A, B, jogo);
    seguem.push(venc.id); jogo.vencedor = venc.id;
    aposJogo(st, A, jogo.gc, jogo.gf, true, rodada); aposJogo(st, B, jogo.gf, jogo.gc, false, rodada);
    jogos.push(jogo);
  }
  st.copa.vivos = seguem.concat(folga); st.copa.fase = fase;
  st.copa.jogos.push({ rodada, fase, jogos: jogos.map(j => ({ casa: j.casa, fora: j.fora, gc: j.gc, gf: j.gf, pen: j.penTxt || "" })) });
  rod.res.copa = { fase, jogos };
  if (st.copa.vivos.length === 1) st.copa.campeao = st.copa.vivos[0];
  rod.ativos = [];
}

function fecharRodada(st, rod) {
  const res = rod.res;
  // classificacao, riqueza, evolucao (docs 11, 12, 13)
  for (let d = 0; d < st.divisoes.length; d++) {
    const div = st.divisoes[d].map(id => timePorId(st, id));
    let T = 1;
    if (d < st.nDiv) {
      div.sort((a, b) => b.pts - a.pts || (b.gp - b.gc) - (a.gp - a.gc) || b.gp - a.gp);
      st.divisoes[d] = div.map(t => t.id);
      T = Math.max(div.reduce((a, t) => a + t.caixa, 0) / st.refCaixa[d], 0.1);
    }
    div.forEach((t, i) => {
      if (d < st.nDiv) t.X = 0.9 * t.X + 0.1 * T;
      const ref = baseDivisao(d) - 2 * i;
      for (const j of t.jog) {
        if (j.c > 0 && (j.pos !== 0 || R.n(2) === 0)) { if (j.f < 50 && j.f + 1 <= Math.min(ref + 5, 50)) j.f++; }
        else if (j.c < 0 && R.n(2) === 0) { if (j.f > 1 && j.f - 1 >= Math.max(ref - 5, 1)) j.f--; }
      }
    });
  }
  st.m = atualizaIndice(st.m, (st.ano0 || 0) + st.temporada - 1);        // contador de temporadas = ano (DS:2b42)
  for (const t of st.times) gerirFinancas(st, t);
  st.ultimaRodada = resumo(st, res);
  st.copaPendente = copaDevida(st, rod.rodada);
  if (st.copaPendente) sortearCopa(st);
  if (rod.rodada === 14 && !st.copaPendente) fimTemporada(st);
  st.rng = R.estado();
  rod.fim = true; rod.ativos = [];
}

function jogarRodada(st) {          // uma jornada e, se houver, a rodada da Taca que vem depois
  let rod = iniciarRodada(st);
  while (!rod.fim) minutoRodada(st, rod);
  const res = rod.res;
  if (st.copaPendente) { rod = iniciarRodada(st); while (!rod.fim) minutoRodada(st, rod); res.copa = rod.res.copa; }
  return res;
}
function jogarEtapa(st) { const rod = iniciarRodada(st); while (!rod.fim) minutoRodada(st, rod); return rod.res; }

function substituirNoJogo(pm, lado, saiId, entraId) {
  const t = lado ? pm.B : pm.A, sai = t.jog.find(j => j.id === saiId && j.papel === 1), entra = t.jog.find(j => j.id === entraId && j.papel === 2);
  if (!sai || !entra) return "Escolha um titular e um reserva.";
  if (t.trocas <= 0) return "Você já fez as substituições permitidas.";
  sai.papel = 0; entra.papel = 1; t.trocas -= 1; setores(pm.A); setores(pm.B);
  pm.ev.push({ m: pm.m, lado, tipo: "troca", txt: `Entra ${entra.nome}, sai ${sai.nome}` });
  return "";
}
function substituirLesionado(pm, entraId) {
  const p = pm.pendente; if (!p) return; pm.pendente = null;
  const t = p.lado ? pm.B : pm.A, entra = t.jog.find(j => j.id === entraId && j.papel === 2), sai = t.jog.find(j => j.id === p.sai);
  if (entra && t.trocas > 0) { entra.papel = 1; t.trocas -= 1; pm.ev.push({ m: pm.m, lado: p.lado, tipo: "troca", txt: `Entra ${entra.nome}, sai ${sai ? sai.nome : ""}` }); setores(pm.A); setores(pm.B); }
}
function substituicaoManual(st, rod, saiId, entraId) {
  const pm = rod && rod.ativos.find(p => p.A.id === st.humano || p.B.id === st.humano);
  if (!pm) return "Seu time não está em campo agora.";
  const t = pm.A.id === st.humano ? pm.A : pm.B, lado = t === pm.A ? 0 : 1;
  const sai = t.jog.find(j => j.id === saiId), entra = t.jog.find(j => j.id === entraId);
  if (!sai || !entra || sai.papel !== 1 || entra.papel !== 2) return "Escolha um titular para sair e um reserva para entrar.";
  if (t.trocas <= 0) return "Você já fez as substituições permitidas.";
  sai.papel = 0; entra.papel = 1; t.trocas -= 1; setores(pm.A); setores(pm.B);
  pm.ev.push({ m: pm.m, lado, tipo: "troca", txt: `Entra ${entra.nome}, sai ${sai.nome}` });
  return `Entra ${entra.nome}, sai ${sai.nome}.`;
}

function resumo(st, res) {   // versao enxuta para guardar
  const enxuga = (j) => ({ casa: j.casa, fora: j.fora, gc: j.gc, gf: j.gf, ev: j.ev, publico: j.publico, renda: j.renda, pen: j.penTxt || "", tipo: j.tipo });
  return { rodada: res.rodada, temporada: res.temporada, divisoes: res.divisoes.map(d => d.map(enxuga)), copa: res.copa ? { fase: res.copa.fase, jogos: res.copa.jogos.map(enxuga) } : null };
}

const anoDe = (st) => (st.ano0 || 0) + st.temporada - 1;
function anotarGoleada(st, A, B, jogo) {
  const rec = st.recordes || (st.recordes = { goleada: null, artilharia: null, temporadas: [] });
  const dif = Math.abs(jogo.gc - jogo.gf), tot = jogo.gc + jogo.gf, g = rec.goleada;
  if (dif >= 3 && (!g || dif > g.dif || (dif === g.dif && tot > g.tot)))
    rec.goleada = { dif, tot, temp: st.temporada, ano: anoDe(st), txt: `${A.curto} ${jogo.gc} × ${jogo.gf} ${B.curto}`, taca: jogo.tipo === 1 };
}

function fimTemporada(st) {
  const camp = timePorId(st, st.divisoes[0][0]);
  lancar(camp, MOEDA.premio1, "premios");
  if (st.copa.campeao != null) lancar(timePorId(st, st.copa.campeao), MOEDA.premio2, "premios");
  for (const t of st.times) t.tj = t.tj || 0;
  guardarVez(st);
  const idsH = st.humanos ? st.humanos.map(h => h.id) : [st.humano];
  const taca = st.copa.campeao != null ? timePorId(st, st.copa.campeao).curto : "—";
  const regs = idsH.map(id => { const dh = divisaoDe(st, id); return { temp: st.temporada, ano: anoDe(st), campeao: camp.curto, taca,
    meu: `${dh < st.nDiv ? (dh + 1) + "ª Divisão" : "Distrital"}, ${st.divisoes[dh].indexOf(id) + 1}º lugar` }; });
  // historico e recordes
  let art = null; for (const t of st.times) for (const j of t.jog) if (j.golsTemp > 0 && (!art || j.golsTemp > art.gols)) art = { nome: j.nome, time: t.curto, gols: j.golsTemp };
  const rec = st.recordes || (st.recordes = { goleada: null, artilharia: null, temporadas: [] });
  rec.temporadas.unshift({ temp: st.temporada, ano: anoDe(st), campeoes: st.divisoes.slice(0, st.nDiv).map(d => timePorId(st, d[0]).curto), taca, artilheiro: art });
  rec.temporadas = rec.temporadas.slice(0, 50);
  if (art && (!rec.artilharia || art.gols > rec.artilharia.gols)) rec.artilharia = Object.assign({ temp: st.temporada, ano: anoDe(st) }, art);
  const rk = st.rankingTr || (st.rankingTr = {});
  const ponto = (nome, k) => { const e = rk[nome] || (rk[nome] = [0, 0]); e[k]++; };
  st.divisoes.slice(0, st.nDiv).forEach(d => ponto(timePorId(st, d[0]).treinador, 0));
  if (st.copa.campeao != null) ponto(timePorId(st, st.copa.campeao).treinador, 1);
  // acesso e descenso (doc 13)
  const movimentos = [];
  for (let d = 0; d < st.nDiv - 1; d++) {
    const cima = st.divisoes[d], baixo = st.divisoes[d + 1];
    const desce = cima.slice(6, 8), sobe = baixo.slice(0, 2);
    st.divisoes[d] = cima.slice(0, 6).concat(sobe); st.divisoes[d + 1] = baixo.slice(2).concat(desce);
    movimentos.push(...sobe.map(id => [id, "sobe"]), ...desce.map(id => [id, "desce"]));
  }
  const ult = st.nDiv - 1, dist = st.divisoes[st.nDiv];
  if (dist.length >= 2) {
    const sobe = embaralhar(dist.slice()).slice(0, 2), desce = st.divisoes[ult].slice(6, 8);
    st.divisoes[ult] = st.divisoes[ult].slice(0, 6).concat(sobe);
    st.divisoes[st.nDiv] = dist.filter(id => !sobe.includes(id)).concat(desce);
    movimentos.push(...sobe.map(id => [id, "sobe"]), ...desce.map(id => [id, "desce"]));
  }
  idsH.forEach((id, k) => {
    const reg = regs[k], mh = movimentos.find(([x]) => x === id);
    reg.mov = mh ? (mh[1] === "sobe" ? "Subiu de divisão" : "Desceu de divisão") : "";
    timePorId(st, id).hist.push(reg);
    comHumano(st, st.humanos ? k : null, () => {
      st.fimDeTemporada = reg;
      if (st.demissoes && divisaoDe(st, st.humano) >= st.nDiv && !st.demitido) demitirHumano(st, "O clube caiu para a Distrital.");
    });
  });
  noticia(st, `Fim da temporada ${st.temporada}. Campeão: ${camp.curto}. Copa: ${taca}.${regs.length === 1 && regs[0].mov ? " " + regs[0].mov + "." : ""}`);
  iniciarTemporada(st);
}

// ------------------------------------------------------------------ treinadores (doc 19)
const NOMES_TR = ["Artur", "Bento", "Celso", "Diamantino", "Eurico", "Fausto", "Germano", "Horácio", "Inácio", "Jaime", "Leonel", "Manuel", "Norberto", "Otávio", "Quim", "Raul", "Silvino", "Toni", "Ulisses", "Zeferino"];
const APEL_TR = ["Abreu", "Bettencourt", "Cabral", "Dinis", "Esteves", "Fontes", "Gouveia", "Henriques", "Jardim", "Leal", "Morais", "Nóbrega", "Oliveira", "Pacheco", "Quaresma", "Ramalho", "Sampaio", "Torres", "Vasconcelos", "Xavier"];
const novoTreinador = () => NOMES_TR[R.n(NOMES_TR.length)] + " " + APEL_TR[R.n(APEL_TR.length)];

function verificarTreinador(st, t) {                                                           // 1010:8b5d
  if (!st.demissoes || (t.tj || 0) < 10 || t.fator >= 0.65) return;
  if (ehHumano(st, t)) { comHumano(st, t.dono, () => { if (!st.demitido) demitirHumano(st, `A moral do time caiu para ${t.fator.toFixed(2)}.`); }); return; }
  const antigo = t.treinador; t.treinador = novoTreinador(); t.tj = 0; t.fator = 1.0;              // 1010:4f40
  const dh = divisaoDe(st, st.humano);
  if (divisaoDe(st, t.id) === dh) noticia(st, `${t.curto} demitiu ${antigo}. ${t.treinador} é o novo treinador.`);
}

function demitirHumano(st, motivo) {
  const H = timePorId(st, st.humano);
  const forcaH = mediaForca(H), dH = Math.min(divisaoDe(st, H.id), st.nDiv - 1);
  // 1010:5343 escolhe clubes candidatos; aproximacao: clubes da mesma divisao ou abaixo (sem a Distrital),
  // de forca parecida ou menor, priorizando os de moral mais baixa
  let cand = st.times.filter(t => t !== H && divisaoDe(st, t.id) < st.nDiv && divisaoDe(st, t.id) >= dH && mediaForca(t) <= forcaH + 3);
  if (cand.length < 3) cand = st.times.filter(t => t !== H && divisaoDe(st, t.id) === st.nDiv - 1);
  cand.sort((a, b) => a.fator - b.fator);
  st.demitido = { motivo, de: H.id, ofertas: cand.slice(0, 3).map(t => t.id) };
  st.carreira.push({ temp: st.temporada, time: H.curto, evento: "Demitido" });
  noticia(st, `${st.treinador} foi demitido do ${H.curto}. ${motivo}`);
}

function aceitarEmprego(st, idTime) {
  if (!st.demitido || !st.demitido.ofertas.includes(idTime)) return "";
  const velho = timePorId(st, st.demitido.de), novo = timePorId(st, idTime);
  if (ehHumano(st, novo) && novo.id !== velho.id) return "";
  velho.treinador = novoTreinador(); velho.tj = 0; velho.fator = 1.0; velho.manual = false; delete velho.escalacao; delete velho.dono;
  novo.treinadorAI = novo.treinador; novo.treinador = st.treinador; novo.tj = 0; novo.fator = 1.0; novo.manual = true; delete novo.escalacao;
  novo.dono = st.humanos ? st.vez : undefined;
  st.humano = novo.id; st.demitido = null; st.pedidos = []; st.lances = {}; guardarVez(st);
  st.carreira.push({ temp: st.temporada, time: novo.curto, evento: "Contratado" });
  noticia(st, `${st.treinador} é o novo treinador do ${novo.nome}.`);
  return `Bem-vindo ao ${novo.nome}!`;
}

// ------------------------------------------------------------------ estadio (doc 19)
const podeAmpliar = (t) => (t.ocup || 0) >= 0.8 && t.estadio < 24;                           // 1010:c030
function custoObra(t, m) {                                                                     // 1010:c172 + 1040:37ee
  const k = t.estadio >= 14 ? 3 : t.estadio >= 6 ? 2 : 1;
  return Math.max(roundP(Math.sqrt(k) * m * 35000 * MOEDA.s / 50000) * 50000, 50000);
}
function ampliar(st, t) {                                                                      // 1010:c081
  const c = custoObra(t, st.m); t.estadio += 1; t.ocup = 0.6; lancar(t, -c, "obras");
  if (ehHumano(st, t)) noticia(st, `Estádio ampliado para ${capacidade(t).toLocaleString("pt-BR")} lugares.`);
  return c;
}
function ampliarEstadio(st) {
  const H = timePorId(st, st.humano), c = custoObra(H, st.m);
  if (!podeAmpliar(H)) return { ok: false, msg: H.estadio >= 24 ? "O estádio já está no tamanho máximo." : "A torcida ainda não enche 80% do estádio, em média. A obra só é liberada quando ele lota." };
  if (H.caixa < c) return { ok: false, msg: `A obra custa ${dinheiro(c)} e você não tem esse valor em caixa.` };
  ampliar(st, H); return { ok: true, msg: `Obra concluída: o estádio agora comporta ${capacidade(H).toLocaleString("pt-BR")} pessoas.` };
}

// ------------------------------------------------------------------ acoes do humano
function pedirEmprestimo(st, valor) {
  const H = timePorId(st, st.humano), lim = limiteEmprestimo(H, st.m);
  valor = Math.floor(valor / MOEDA.q) * MOEDA.q;
  const v = Math.max(0, Math.min(valor, lim - H.divida)); H.divida += v; H.caixa += v; return v;
}
function pagarEmprestimo(st, valor) {
  const H = timePorId(st, st.humano);
  const v = Math.max(0, Math.min(valor, H.divida, H.caixa)); H.divida -= v; H.caixa -= v; return v;
}
function venderJogador(st, idJog, minimo) {
  R.definir(st.rng);
  const H = timePorId(st, st.humano), j = H.jog.find(q => q.id === idJog);
  if (!j) return { ok: false, msg: "Jogador não encontrado." };
  if (!podeSair(H, j)) return { ok: false, msg: `Não dá para vender: ${motivoNaoSai(H, j)}.` };
  const r = leilao(st, H, j, Math.max(0, minimo || 0));
  st.rng = R.estado();
  return r ? { ok: true, msg: `${j.nome} vendido para o ${r.comprador.curto} por ${dinheiro(r.valor)}.` } : { ok: false, msg: `Nenhum clube ofereceu ${dinheiro(minimo || 0)} ou mais por ${j.nome}.` };
}
function ofertasLeilao(st, idJog, minimo) {
  const H = timePorId(st, st.humano), j = H.jog.find(q => q.id === idJog); if (!j) return [];
  const s = R.estado(), lista = [];
  for (const B of st.times) {
    if (B === H) continue;
    if (!elegivel(B, j)) { lista.push({ id: B.id, clube: B.curto, valor: 0, motivo: "elenco cheio" }); continue; }
    if (B.caixa < minimo) { lista.push({ id: B.id, clube: B.curto, valor: 0, motivo: "sem dinheiro" }); continue; }
    const of = oferta(st, B, j);
    lista.push({ id: B.id, clube: B.curto, valor: of >= minimo ? of : 0, motivo: of > 0 ? (of >= minimo ? "" : "abaixo do mínimo") : "sem interesse" });
  }
  R.definir(s); return lista;
}
function venderPara(st, idJog, idComprador, valor) {
  const H = timePorId(st, st.humano), j = H.jog.find(q => q.id === idJog), B = timePorId(st, idComprador);
  if (!j || !B) return "Venda indisponível.";
  if (!podeSair(H, j)) return `Não dá para vender: ${motivoNaoSai(H, j)}.`;
  if (B.caixa < valor || !elegivel(B, j)) return `${B.curto} desistiu da compra.`;
  transferir(st, H, j, B, valor); return `${j.nome} vendido para o ${B.curto} por ${dinheiro(valor)}.`;
}
function melhorOfertaPor(st, idJog) {
  const H = timePorId(st, st.humano), j = H.jog.find(q => q.id === idJog); if (!j) return null;
  const s = R.estado(); let melhor = 0, quem = null;
  for (const B of st.times) { if (B === H || !elegivel(B, j)) continue; const of = oferta(st, B, j); if (of > melhor) { melhor = of; quem = B; } }
  R.definir(s); return { valor: melhor, clube: quem ? quem.nome : null };
}
function exigencia(st, j) { return salarioPedido(salario(j.f, 1, st.m), Math.max(st.rodada, 1)); }
function renovarContrato(st, idJog, valor) {        // Jogador > Renovar contrato: "Nem pensar! Exijo X"
  const H = timePorId(st, st.humano), j = H.jog.find(q => q.id === idJog); if (!j) return { ok: false };
  const ex = exigencia(st, j);
  if (valor >= ex) { j.sal = valor; j.reneg = true; return { ok: true, valor }; }
  return { ok: false, exige: ex };
}
function aceitarExigencia(st, idJog, valor) { const H = timePorId(st, st.humano), j = H.jog.find(q => q.id === idJog); if (j) { j.sal = valor; j.reneg = true; } }
function responderPedido(st, idJog, aceita) {
  const p = st.pedidos.find(q => q.id === idJog); st.pedidos = st.pedidos.filter(q => q.id !== idJog);
  const H = timePorId(st, st.humano), j = H.jog.find(q => q.id === idJog);
  if (!p || !j) return "";
  if (aceita) { j.sal = p.pedido; return `${j.nome} aceitou o novo salário de ${dinheiro(p.pedido)}.`; }
  st.aVenda.push({ id: j.id, time: H.id, minimo: 0, rod: st.rodada, temp: st.temporada, forcada: true });
  return `${j.nome} não aceitou ficar e foi colocado na lista de transferências.`;
}

return { substituirNoJogo, sortearCopa, substituirLesionado, precoBilhete, contaPos, estrangeiros, proximaEtapa, jogarEtapa, leiloesPendentes, interesseHumano, resolverLeilao, renovarContrato, exigencia, aceitarExigencia, motivoNaoSai, podeSair, TABELA, MATRIZ, trocarVez, anoDe, ESQUEMAS_ESPECIAIS, criarJogo, cotasDosPaises, ofertasLeilao, venderPara, afinidade, jogarRodada, iniciarRodada, minutoRodada, substituicaoManual, aceitarEmprego, ampliarEstadio, podeAmpliar, custoObra, usarMoeda, MOEDAS, moeda: () => MOEDA, timePorId, divisaoDe, mediaForca, folha, salario, precoJogador, limiteEmprestimo, juros,
  capacidade, dinheiro, pedirEmprestimo, pagarEmprestimo, venderJogador, melhorOfertaPor, responderPedido, escalar, categoria,
  FORMACOES, POS, NOME_POS, TEMPERAMENTO, MOEDA, TABELA, criarRng, setRng: (r) => { R = r; }, interno: { oferta, utilidade, atributosDoNome } };
})();
if (typeof module !== "undefined") module.exports = Motor;
