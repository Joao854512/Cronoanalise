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
let dadosRegistro = []; // Vai guardar os dados agregados se quiser
let inicioTempo = null;
let intervalo = null;
let tempoAtivo = null;

let tempos = []; // Array de objetos, um para cada atividade, com tempos acumulados por tipo

// Carregar JSON
fetch("estrutura.json")
  .then(res => res.json())
  .then(data => {
    dadosJson = data.filter(d => d.Predio && d.Linha && d.Posto && d.Atividade);
    preencherPredios();
  })
  .catch(err => console.error("Erro ao carregar estrutura.json:", err));

// ... manter preencherPredios, preencherLinhas e preencherPostos igual

function carregarAtividades(predio, linha, posto) {
  atividades = dadosJson.filter(d => d.Predio === predio && d.Linha === linha && d.Posto === posto);
  atividadeAtual = 0;
  // Inicializar tempos para cada atividade
  tempos = atividades.map(item => {
    let obj = { atividade: item.Atividade };
    tiposTempo.forEach(t => (obj[t.nome] = 0));
    return obj;
  });
  criarBotoes();
  mostrarAtividade();
  atualizarTempoTotal();
}

// Atualizar criarBotoes para só criar botões das atividades (como antes)
function criarBotoes() {
  const divBotoes = document.getElementById('botoesAtividades');
  if(!divBotoes) {
    // Se quiser criar div específica para botões das atividades
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

// Mostrar atividade e tipos de tempo para ela
function mostrarAtividade() {
  const titulo = document.getElementById('atividadeAtualTitulo');
  const div = document.getElementById('botoes');
  div.innerHTML = ''; // limpar

  if (!atividades[atividadeAtual]) {
    titulo.textContent = 'Todas as atividades foram registradas.';
    atualizarTempoTotal();
    gerarTabelaResumo();
    return;
  }

  const atv = atividades[atividadeAtual].Atividade;
  titulo.textContent = `Atividade Atual: ${atv}`;

  // Mostrar botões e tempo para cada tipo
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

// Função para trocar tipo de tempo ativo
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

// Parar todos tempos ativos
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

// Avançar atividade
function pularAtividade() {
  pararTudo();
  if (atividadeAtual + 1 < atividades.length) {
    atividadeAtual++;
    mostrarAtividade();
  }
}

// Voltar atividade
function voltarAtividade() {
  pararTudo();
  if (atividadeAtual > 0) {
    atividadeAtual--;
    mostrarAtividade();
  }
}

// Atualizar tempo total acumulado
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
  if(el)
    el.textContent = `Tempo total acumulado: ${calcularTempoTotal().toFixed(2)} minutos`;
}

// Gerar tabela resumo de tempos
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

// Exportar CSV (pode adaptar para XLSX com a lib XLSX)
function exportarCSV() {
  const nome = document.getElementById('nomeArquivo').value || 'dados';
  let csv = 'Atividade,' + tiposTempo.map(t => t.nome).join(',') + '\n';
  tempos.forEach(t => {
    csv += t.atividade + ',' + tiposTempo.map(tt => t[tt.nome].toFixed(2)).join(',') + '\n';
  });
  const blob = new Blob([csv], {type: 'text/csv'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${nome}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
