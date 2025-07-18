// script.js

let db;
let atividadeAtual = 0;
let atividades = [];
let dadosRegistro = [];
let inicioAtividade = null;

// Carrega o banco SQLite
initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}` })
  .then(SQL => {
    fetch('banco.sqlite')
      .then(res => res.arrayBuffer())
      .then(buffer => {
        db = new SQL.Database(new Uint8Array(buffer));
        preencherFiltros();
      });
  });

function preencherFiltros() {
  const selectPredio = document.getElementById('selectPredio');
  const stmt = db.prepare("SELECT DISTINCT predio FROM estrutura ORDER BY predio");
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const option = document.createElement('option');
    option.value = row.predio;
    option.textContent = row.predio;
    selectPredio.appendChild(option);
  }
  stmt.free();

  selectPredio.addEventListener('change', () => {
    preencherLinhas(selectPredio.value);
  });
}

function preencherLinhas(predio) {
  const selectLinha = document.getElementById('selectLinha');
  selectLinha.innerHTML = '<option value="">Selecione a Linha</option>';
  const stmt = db.prepare("SELECT DISTINCT linha FROM estrutura WHERE predio = ? ORDER BY linha");
  stmt.bind([predio]);
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const option = document.createElement('option');
    option.value = row.linha;
    option.textContent = row.linha;
    selectLinha.appendChild(option);
  }
  stmt.free();

  selectLinha.addEventListener('change', () => {
    preencherPostos(predio, selectLinha.value);
  });
}

function preencherPostos(predio, linha) {
  const selectPosto = document.getElementById('selectPosto');
  selectPosto.innerHTML = '<option value="">Selecione o Posto</option>';
  const stmt = db.prepare("SELECT DISTINCT posto FROM estrutura WHERE predio = ? AND linha = ? ORDER BY posto");
  stmt.bind([predio, linha]);
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const option = document.createElement('option');
    option.value = row.posto;
    option.textContent = row.posto;
    selectPosto.appendChild(option);
  }
  stmt.free();

  selectPosto.addEventListener('change', () => {
    carregarAtividades(predio, linha, selectPosto.value);
  });
}

function carregarAtividades(predio, linha, posto) {
  atividades = [];
  const stmt = db.prepare("SELECT atividade, tipo FROM estrutura WHERE predio = ? AND linha = ? AND posto = ? ORDER BY id");
  stmt.bind([predio, linha, posto]);
  while (stmt.step()) {
    const row = stmt.getAsObject();
    atividades.push(row);
  }
  stmt.free();

  criarBotoes();
  mostrarAtividade();
}

function criarBotoes() {
  const divBotoes = document.getElementById('botoes');
  divBotoes.innerHTML = '';
  atividades.forEach((item, index) => {
    const botao = document.createElement('button');
    botao.textContent = item.atividade;
    botao.className = `botao-${item.tipo.toLowerCase()}`;
    botao.onclick = () => iniciarAtividade(index);
    divBotoes.appendChild(botao);
  });
}

function mostrarAtividade() {
  const titulo = document.getElementById('atividadeAtualTitulo');
  if (atividades[atividadeAtual]) {
    titulo.textContent = `Atividade Atual: ${atividades[atividadeAtual].atividade}`;
  } else {
    titulo.textContent = '';
  }
}

function iniciarAtividade(index) {
  if (inicioAtividade !== null) {
    const tempo = (Date.now() - inicioAtividade) / 1000;
    const registro = {
      predio: document.getElementById('selectPredio').value,
      linha: document.getElementById('selectLinha').value,
      posto: document.getElementById('selectPosto').value,
      operador: document.getElementById('nomeOperador').value,
      atividade: atividades[atividadeAtual].atividade,
      tipo: atividades[atividadeAtual].tipo,
      tempo: tempo.toFixed(2)
    };
    dadosRegistro.push(registro);
  }
  atividadeAtual = index;
  inicioAtividade = Date.now();
  mostrarAtividade();
  atualizarTabelaResumo();
}

function pularAtividade() {
  if (atividadeAtual + 1 < atividades.length) {
    iniciarAtividade(atividadeAtual + 1);
  }
}

function voltarAtividade() {
  if (atividadeAtual - 1 >= 0) {
    iniciarAtividade(atividadeAtual - 1);
  }
}

function pararTudo() {
  if (inicioAtividade !== null) {
    const tempo = (Date.now() - inicioAtividade) / 1000;
    const registro = {
      predio: document.getElementById('selectPredio').value,
      linha: document.getElementById('selectLinha').value,
      posto: document.getElementById('selectPosto').value,
      operador: document.getElementById('nomeOperador').value,
      atividade: atividades[atividadeAtual].atividade,
      tipo: atividades[atividadeAtual].tipo,
      tempo: tempo.toFixed(2)
    };
    dadosRegistro.push(registro);
  }
  atividadeAtual = 0;
  inicioAtividade = null;
  mostrarAtividade();
  atualizarTabelaResumo();
}

function atualizarTabelaResumo() {
  const tabela = document.getElementById('tabelaResumo');
  tabela.innerHTML = '<h3>Resumo das Atividades</h3>';
  if (dadosRegistro.length === 0) return;

  const table = document.createElement('table');
  const header = document.createElement('tr');
  ['Prédio', 'Linha', 'Posto', 'Operador', 'Atividade', 'Tipo', 'Tempo (s)'].forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    header.appendChild(th);
  });
  table.appendChild(header);

  dadosRegistro.forEach(reg => {
    const row = document.createElement('tr');
    Object.values(reg).forEach(val => {
      const td = document.createElement('td');
      td.textContent = val;
      row.appendChild(td);
    });
    table.appendChild(row);
  });
  tabela.appendChild(table);
}

function exportarCSV() {
  const nome = document.getElementById('nomeArquivo').value || 'dados';
  let csv = 'Prédio,Linha,Posto,Operador,Atividade,Tipo,Tempo\n';
  dadosRegistro.forEach(r => {
    csv += `${r.predio},${r.linha},${r.posto},${r.operador},${r.atividade},${r.tipo},${r.tempo}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${nome}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
