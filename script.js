// script.js

const tiposTempo = [
  { nome: "Operacao", classe: "botao-operacao" },
  { nome: "Maquina", classe: "botao-maquina" },
  { nome: "Movimentacao", classe: "botao-outros" },
  { nome: "Espera", classe: "botao-outros" },
  { nome: "Retrabalho", classe: "botao-outros" },
  { nome: "Aciclicos", classe: "botao-documentacao" },
];

let dadosJson = [];
let atividadeAtual = 0;
let atividades = [];
let dadosRegistro = [];
let inicioTempo = null;
let intervalo = null;
let tempoAtivo = null;

let tempos = [];

fetch("estrutura.json")
  .then(res => res.json())
  .then(data => {
    dadosJson = data.filter(d => d.Predio && d.Linha && d.Posto && d.Atividade);
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
  atividadeAtual = 0;
  tempos = atividades.map(item => {
    let obj = { atividade: item.Atividade };
    tiposTempo.forEach(t => (obj[t.nome] = 0));
    return obj;
  });
  criarBotoes();
  mostrarAtividade();
  atualizarTempoTotal();
}

function criarBotoes() {
  const divBotoes = document.getElementById('botoesAtividades');
  if (!divBotoes) {
    const div = document.createElement('div');
    div.id = 'botoesAtividades';
    document.getElementById('botoes').appendChild(div);
  }
  document.getElementById('botoesAtividades').innerHTML = '';
  atividades.forEach((item, index) => {
    const botao = document.createElement('button');
    botao.textContent = item.Atividade;
    botao.className = 'botao-atividade';
    botao.onclick = () => iniciarAtividade(index);
    document.getElementById('botoesAtividades').appendChild(botao);
  });
}

function mostrarAtividade() {
  const titulo = document.getElementById('atividadeAtualTitulo');
  const div = document.getElementById('botoes');
  div.innerHTML = '';

  if (!atividades[atividadeAtual]) {
    titulo.textContent = 'Todas as atividades foram registradas.';
    atualizarTempoTotal();
    gerarTabelaResumo();
    return;
  }

  const atv = atividades[atividadeAtual].Atividade;
  titulo.textContent = `Atividade Atual: ${atv}`;

  tiposTempo.forEach(t => {
    const linha = document.createElement('div');
    linha.className = 'linha-tempo';
    linha.innerHTML = `
      <span>${t.nome}</span>
      <button class="${t.classe}" onclick="trocarTempo('${t.nome}')">Iniciar</button>
      <span id="tempo-${t.nome}">${tempos[atividadeAtual][t.nome].toFixed(2)}</span>
    `;
    div.appendChild(linha);
  });
}

function trocarTempo(novoTipo) {
  if (tempoAtivo) {
    clearInterval(intervalo);
    const decorrido = (Date.now() - inicioTempo) / 60000;
    tempos[atividadeAtual][tempoAtivo] += decorrido;
    document.getElementById(`tempo-${tempoAtivo}`).innerText = tempos[atividadeAtual][tempoAtivo].toFixed(2);
  }
  tempoAtivo = novoTipo;
  inicioTempo = Date.now();
  intervalo = setInterval(() => {
    const decorrido = (Date.now() - inicioTempo) / 60000;
    const total = tempos[atividadeAtual][tempoAtivo] + decorrido;
    document.getElementById(`tempo-${tempoAtivo}`).innerText = total.toFixed(2);
    atualizarTempoTotal();
  }, 100);
}

function pararTudo() {
  if (tempoAtivo) {
    clearInterval(intervalo);
    const decorrido = (Date.now() - inicioTempo) / 60000;
    tempos[atividadeAtual][tempoAtivo] += decorrido;
    document.getElementById(`tempo-${tempoAtivo}`).innerText = tempos[atividadeAtual][tempoAtivo].toFixed(2);
    tempoAtivo = null;
    atualizarTempoTotal();
  }
}

function pularAtividade() {
  pararTudo();
  if (atividadeAtual + 1 < atividades.length) {
    atividadeAtual++;
    mostrarAtividade();
  }
}

function voltarAtividade() {
  pararTudo();
  if (atividadeAtual > 0) {
    atividadeAtual--;
    mostrarAtividade();
  }
}

function calcularTempoTotal() {
  let total = 0;
  tempos.forEach(t => {
    tiposTempo.forEach(tt => {
      total += t[tt.nome];
    });
  });
  return total;
}

function atualizarTempoTotal() {
  const el = document.getElementById('tempoTotalAcumulado');
  if (el)
    el.textContent = `Tempo total acumulado: ${calcularTempoTotal().toFixed(2)} minutos`;
}

function gerarTabelaResumo() {
  const divResumo = document.getElementById('tabelaResumo');
  if (!tempos.length) return;

  let html = "<h3>Resumo das Atividades:</h3><table><thead><tr><th>Atividade</th>";
  tiposTempo.forEach(t => html += `<th>${t.nome}</th>`);
  html += "</tr></thead><tbody>";

  tempos.forEach(t => {
    html += `<tr><td>${t.atividade}</td>`;
    tiposTempo.forEach(tt => {
      html += `<td>${t[tt.nome].toFixed(2)}</td>`;
    });
    html += "</tr>";
  });

  html += "</tbody></table>";
  divResumo.innerHTML = html;
}

function exportarCSV() {
  const nome = document.getElementById('nomeArquivo').value || 'dados';
  let csv = 'Atividade,' + tiposTempo.map(t => t.nome).join(',') + '\n';
  tempos.forEach(t => {
    csv += t.atividade + ',' + tiposTempo.map(tt => t[tt.nome].toFixed(2)).join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${nome}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

