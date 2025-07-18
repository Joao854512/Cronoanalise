// script.js

let dadosJson = [];
let atividadeAtual = 0;
let atividades = [];
let dadosRegistro = [];
let inicioAtividade = null;

// Carrega estrutura.json e inicia preenchimento
fetch("estrutura.json")
  .then(res => res.json())
  .then(data => {
    dadosJson = data;
    preencherPredios();
  })
  .catch(err => console.error("Erro ao carregar estrutura.json:", err));

function preencherPredios() {
  const selectPredio = document.getElementById('selectPredio');
  const predios = [...new Set(dadosJson.map(d => d.Predio))].sort();
  predios.forEach(predio => {
    const option = document.createElement('option');
    option.value = predio;
    option.textContent = predio;
    selectPredio.appendChild(option);
  });

  selectPredio.addEventListener('change', () => {
    preencherLinhas(selectPredio.value);
  });
}

function preencherLinhas(predio) {
  const selectLinha = document.getElementById('selectLinha');
  selectLinha.innerHTML = '<option value="">Selecione a Linha</option>';
  const linhas = [...new Set(dadosJson.filter(d => d.Predio === predio).map(d => d.Linha))].sort();
  linhas.forEach(linha => {
    const option = document.createElement('option');
    option.value = linha;
    option.textContent = linha;
    selectLinha.appendChild(option);
  });

  selectLinha.addEventListener('change', () => {
    preencherPostos(predio, selectLinha.value);
  });
}

function preencherPostos(predio, linha) {
  const selectPosto = document.getElementById('selectPosto');
  selectPosto.innerHTML = '<option value="">Selecione o Posto</option>';
  const postos = [...new Set(dadosJson.filter(d => d.Predio === predio && d.Linha === linha).map(d => d.Posto))].sort();
  postos.forEach(posto => {
    const option = document.createElement('option');
    option.value = posto;
    option.textContent = posto;
    selectPosto.appendChild(option);
  });

  selectPosto.addEventListener('change', () => {
    carregarAtividades(predio, linha, selectPosto.value);
  });
}

function carregarAtividades(predio, linha, posto) {
  atividades = dadosJson.filter(d => d.Predio === predio && d.Linha === linha && d.Posto === posto);
  criarBotoes();
  mostrarAtividade();
}

function criarBotoes() {
  const divBotoes = document.getElementById('botoes');
  divBotoes.innerHTML = '';
  atividades.forEach((item, index) => {
    const botao = document.createElement('button');
    botao.textContent = item.Atividade;
    botao.className = `botao-${item.tipo.toLowerCase()}`;
    botao.onclick = () => iniciarAtividade(index);
    divBotoes.appendChild(botao);
  });
}

function mostrarAtividade() {
  const titulo = document.getElementById('atividadeAtualTitulo');
  if (atividades[atividadeAtual]) {
    titulo.textContent = `Atividade Atual: ${atividades[atividadeAtual].Atividade}`;
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
      atividade: atividades[atividadeAtual].Atividade,
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
      atividade: atividades[atividadeAtual].Atividade,
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
