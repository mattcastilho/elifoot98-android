/* Fontes de dados: liga ficticia gerada e leitor de arquivos .EFT (especificacao/01). */
"use strict";
const Dados = (() => {

const LUGARES_A = ["Vale", "Ribeira", "Alto", "Monte", "Lagoa", "Serra", "Campo", "Ponte", "Torre", "Vila", "Fonte", "Pedra", "Quinta", "Barra", "Seara", "Cruz", "Moinho", "Areal"];
const LUGARES_B = ["Seco", "Verde", "Grande", "Novo", "Alegre", "do Sul", "da Pedra", "Branco", "Real", "dos Cedros", "Formoso", "do Mar", "Fundo", "da Serra", "Velho", "das Flores", "do Rio", "Claro"];
const MODELOS = ["Grupo Desportivo de %", "União de %", "% Futebol Clube", "Académico de %", "Clube Desportivo de %", "Recreativo de %", "Atlético de %", "Sport %", "Associação Desportiva de %"];
const NOMES = ["Rui", "Tiago", "Nuno", "Bruno", "Hugo", "Pedro", "Paulo", "Jorge", "Vítor", "Sérgio", "Carlos", "Mário", "Filipe", "Ricardo", "André", "Fábio", "Luís", "Miguel", "Joaquim", "Hélder", "Rogério", "Armando", "Abel", "Fernando", "Daniel", "Marco", "Renato", "Álvaro", "Gil", "Ivo"];
const APELIDOS = ["Tavares", "Correia", "Pinheiro", "Moura", "Lobo", "Seixas", "Bastos", "Coutinho", "Vieira", "Antunes", "Rebelo", "Simões", "Macedo", "Quintas", "Faria", "Godinho", "Neves", "Barros", "Calado", "Mendes", "Peixoto", "Teixeira", "Brandão", "Valente", "Carvalhal", "Lameiras", "Sardinha", "Matos", "Rocha", "Prates"];
const BR_NOMES = ["Edmilson", "Wanderley", "Cleiton", "Rivaldo", "Jairo", "Marcelo", "Adriano", "Thiago", "Wellington", "Juninho"];
const AF_NOMES = ["Mbala", "Akwá", "Nandinho", "Sabino", "Zico", "Mantorras", "Quinito", "Djalma"];
const CORES = [[200, 30, 40], [20, 70, 160], [0, 120, 70], [250, 200, 0], [255, 255, 255], [20, 20, 20], [120, 20, 60], [0, 150, 200], [230, 110, 0], [90, 40, 140]];

function gerarLiga(seed) {
  const R = Motor.criarRng(seed || 7);
  const pick = (a) => a[R.n(a.length)];
  const usados = new Set(), times = [];
  const forcas = [17, 15, 14, 14, 13, 13, 12, 12, 11, 11, 10, 10, 9, 9, 9, 8, 8, 8, 7, 7, 7, 6, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1];
  for (let i = 0; i < forcas.length; i++) {
    let lugar; do { lugar = pick(LUGARES_A) + " " + pick(LUGARES_B); } while (usados.has(lugar)); usados.add(lugar);
    const c1 = pick(CORES); let c2; do { c2 = pick(CORES); } while (c2 === c1);
    const jog = [], qtd = [2, 6, 6, 4 + R.n(2)], nomes = new Set();
    for (let p = 0; p < 4; p++) for (let k = 0; k < qtd[p]; k++) {
      let nome, nac = "POR"; const r = R();
      do {
        if (r < 0.12) { nome = pick(BR_NOMES); nac = "BRA"; }
        else if (r < 0.17) { nome = pick(AF_NOMES); nac = pick(["ANG", "MOC", "CAV"]); }
        else nome = pick(NOMES) + " " + pick(APELIDOS);
      } while (nomes.has(nome)); nomes.add(nome);
      jog.push([nome, p, nac]);
    }
    times.push({ n: pick(MODELOS).replace("%", lugar), c: lugar.toUpperCase(), p: "POR", f: forcas[i], cor: [...c1, ...c2],
      tr: pick(NOMES) + " " + pick(APELIDOS), j: jog });
  }
  return times;
}

// ---- leitor de .EFT (doc 01): cabecalho "EFa", strings cifradas por soma acumulada
const dec1252 = (() => { try { return new TextDecoder("windows-1252"); } catch (e) { return new TextDecoder("latin1"); } })();
function lerEFT(buf) {
  const d = new Uint8Array(buf);
  if (d[0] !== 0x45 || d[1] !== 0x46 || d[2] !== 0x61) throw new Error("cabeçalho inválido");
  let pos = 0x32;
  const str = () => {
    const L = d[pos], out = new Uint8Array(L); let prev = L;
    for (let i = 0; i < L; i++) { const c = d[pos + 1 + i]; out[i] = (c - prev) & 255; prev = c; }
    pos += 1 + L; return dec1252.decode(out);
  };
  const n = str(), c = str(); const cores = [...d.slice(pos, pos + 8)]; pos += 8;
  const p = str(); const f = d[pos], nj = d[pos + 1]; pos += 3;
  const j = [];
  for (let k = 0; k < nj; k++) { const nac = str(), nome = str(); j.push([nome, d[pos], nac]); pos += 2; }
  const tr = str();
  return { n, c, p, f, cor: [cores[0], cores[1], cores[2], cores[4], cores[5], cores[6]], tr, j };
}

// ---- .TXE (doc 15): strings Pascal cifradas duas vezes com a mesma cifra
function lerTXE(buf) {
  const d = new Uint8Array(buf); const out = []; let pos = 0;
  const decifra = (b) => { for (let i = b.length - 1; i > 0; i--) b[i] = (b[i] - b[i - 1]) & 255; return b; };
  while (pos < d.length) { const L = d[pos]; const b = d.slice(pos, pos + 1 + L); pos += 1 + L; out.push(dec1252.decode(decifra(decifra(b)).slice(1))); }
  return out;
}
const lerArbitros = (buf) => lerTXE(buf).slice(1).filter(l => l.length > 4).map(l => [l.slice(0, 3), l.slice(4)]);

const GRUPOS = {
  Bosman: ["POR", "ESP", "FRA", "ITA", "ALE", "AUT", "GRE", "ING", "ESC", "WAL", "ILN", "IRL", "DIN", "BEL", "HOL", "LUX", "FIN", "SUE"],
  PLOP: ["POR", "BRA", "ANG", "MOC", "CAV", "STP", "GBI", "GNE", "TIM"] };

return { gerarLiga, lerEFT, lerTXE, lerArbitros, GRUPOS };
})();
if (typeof module !== "undefined") module.exports = Dados;
