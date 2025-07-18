const tiposTempo = [
  { nome: "operacao", classe: "botao-operacao" },
  { nome: "maquina", classe: "botao-maquina" },
  { nome: "movimentacao", classe: "botao-outros" },
  { nome: "espera", classe: "botao-outros" },
  { nome: "retrabalho", classe: "botao-outros" },
  { nome: "aciclicos", classe: "botao-documentacao" }
];

let dados = []; // dados completos da planilha
let dadosFiltrados = []; // após filtros prédio, linha e posto
let predios = [];
let linhas = [];
let postos = [];

let atividades = [];
let tempos = [];
let atividadeAtual = 0;
let tempoAtivo = null;
let intervalo = null;
let inicioTempo = null;

let predioSelecionado = "";
let linhaSelecionada = "";
let postoSelecionado = "";

function carregarArquivoExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const planilha = workbook.Sheets[workbook.SheetNames[0]];
    dados = XLSX.utils.sheet_to_json(planilha);

    predios = [...new Set(dados.map(r => r.Predio).filter(Boolean))];
    linhas = [...new Set(dados.map(r => r.Linha).filter(Boolean))];
    postos = [...new Set(dados.map(r => r.Posto).filter(Boolean))];

    popularSelect("selectPredio", predios);
    popularSelect("selectLinha", linhas);
    popularSelect("selectPosto", postos);

    resetFiltros();
  };
  reader.readAsArrayBuffer(file);
}

function popularSelect(id, valores) {
  const select = document.getElementById(id);
  select.innerHTML = `<option value="">Selecione</option>`;
  valores.forEach(v => {
    const option = document.createElement("option");
    option.value = v;
    option.text = v;
    select.appendChild(option);
  });
}

function resetFiltros() {
  predioSelecionado = "";
  linhaSelecionada = "";
  postoSelecionado = "";
  atividades = [];
  tempos = [];
  atividadeAtual = 0;
  tempoAtivo = null;
  clearInterval(intervalo);
  inicioTempo = null;
  document.getElementById("atividadeAtualTitulo").innerHTML = "";
  document.getElementById("botoes").innerHTML = "";
  document.getElementById("tabelaResumo").innerHTML = "";
  atualizarTempoTotal();
}

function filtrarDados() {
  predioSelecionado = document.getElementById("selectPredio").value;
  linhaSelecionada = document.getElementById("selectLinha").value;
  postoSelecionado = document.getElementById("selectPosto").value;

  dadosFiltrados = dados.filter(d => {
    return (!predioSelecionado || d.Predio === predioSelecionado)
        && (!linhaSelecionada || d.Linha === linhaSelecionada)
        && (!postoSelecionado || d.Posto === postoSelecionado);
  });

  atividades = [...new Set(dadosFiltrados.map(d => d.Atividade).filter(Boolean))];
  tempos = new Array(atividades.length).fill(null);
  atividadeAtual = 0;
  tempoAtivo = null;
  clearInterval(intervalo);
  inicioTempo = null;

  if (atividades.length > 0) {
    mostrarAtividade();
  } else {
    document.getElementById("atividadeAtualTitulo").innerHTML = "<h3>Nenhuma atividade encontrada com esses filtros.</h3>";
    document.getElementById("botoes").innerHTML = "";
  }
  atualizarTempoTotal();
}

function mostrarAtividade() {
  const titulo = document.getElementById("atividadeAtualTitulo");
  const div = document.getElementById("botoes");
  const btnParar = document.getElementById("btnParar");
  div.innerHTML = "";

  if (!atividades[atividadeAtual]) {
    titulo.innerHTML = "<h3>Todas as atividades foram registradas.</h3>";
    document.getElementById("btnProxima").style.display = "none";
    btnParar.style.display = "none";
    gerarTabelaResumo();
    atualizarTempoTotal();
    return;
  }

  const atv = atividades[atividadeAtual];
  titulo.innerHTML = `<h3>Atividade: ${atv}</h3>`;

  if (!tempos[atividadeAtual]) {
    tempos[atividadeAtual] = { atividade: atv };
    tiposTempo.forEach(t => tempos[atividadeAtual][t.nome] = 0);
  }

  tiposTempo.forEach(t => {
    const linha = document.createElement("div");
    linha.className = "linha-tempo";
    linha.innerHTML = `
      <span>${t.nome}</span>
      <button class="${t.classe}" onclick="trocarTempo('${t.nome}')">Iniciar</button>
      <span id="${t.nome}-${atividadeAtual}">${tempos[atividadeAtual][t.nome].toFixed(2)}</span>
    `;
    div.appendChild(linha);
  });

  document.getElementById("btnProxima").style.display = "inline-block";
  btnParar.style.display = "inline-block";
  atualizarTempoTotal();
}

function trocarTempo(novoTipo) {
  if (tempoAtivo) {
    clearInterval(intervalo);
    const decorrido = (Date.now() - inicioTempo) / 60000;
    tempos[atividadeAtual][tempoAtivo] += decorrido;
    document.getElementById(`${tempoAtivo}-${atividadeAtual}`).innerText = tempos[atividadeAtual][tempoAtivo].toFixed(2);
  }

  tempoAtivo = novoTipo;
  inicioTempo = Date.now();

  intervalo = setInterval(() => {
    const decorrido = (Date.now() - inicioTempo) / 60000;
    const total = tempos[atividadeAtual][novoTipo] + decorrido;
    document.getElementById(`${novoTipo}-${atividadeAtual}`).innerText = total.toFixed(2);
    atualizarTempoTotal();
  }, 100);
}

function pararTudo() {
  if (tempoAtivo) {
    clearInterval(intervalo);
    const decorrido = (Date.now() - inicioTempo) / 60000;
    tempos[atividadeAtual][tempoAtivo] += decorrido;
    document.getElementById(`${tempoAtivo}-${atividadeAtual}`).innerText = tempos[atividadeAtual][tempoAtivo].toFixed(2);
    tempoAtivo = null;
    atualizarTempoTotal();
  }
}

function pularAtividade() {
  pararTudo();
  atividadeAtual++;
  mostrarAtividade();
}

function voltarAtividade() {
  pararTudo();
  if (atividadeAtual > 0) {
    atividadeAtual--;
    mostrarAtividade();
  }
}

function exportarCSV() {
  if (!tempos.length) {
    alert("Nenhum dado para exportar.");
    return;
  }
  const nomeArquivo = document.getElementById("nomeArquivo").value || `tempos_export`;
  const nomeOperador = document.getElementById("nomeOperador").value || "Operador Não Informado";

  const dadosExport = tempos.filter(Boolean).map(t => ({
    Operador: nomeOperador,
    Predio: predioSelecionado,
    Linha: linhaSelecionada,
    Posto: postoSelecionado,
    Atividade: t.atividade,
    operacao: t.operacao,
    maquina: t.maquina,
    movimentacao: t.movimentacao,
    espera: t.espera,
    retrabalho: t.retrabalho,
    aciclicos: t.aciclicos
  }));

  const ws = XLSX.utils.json_to_sheet(dadosExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Resultados");
  XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
}

function calcularTempoTotal() {
  let total = 0;
  tempos.forEach(t => {
    if (t) tiposTempo.forEach(tt => total += t[tt.nome]);
  });
  return total;
}

function atualizarTempoTotal() {
  document.getElementById("tempoTotalAcumulado").innerText = `Tempo total acumulado: ${calcularTempoTotal().toFixed(2)} minutos`;
}

function gerarTabelaResumo() {
  const divResumo = document.getElementById("tabelaResumo");
  if (!tempos.length) return;

  let html = "<h3>Resumo das Atividades:</h3><table><thead><tr><th>Atividade</th>";
  tiposTempo.forEach(t => {
    html += `<th>${t.nome}</th>`;
  });
  html += "</tr></thead><tbody>";

  tempos.forEach(t => {
    if (t) {
      html += `<tr><td>${t.atividade}</td>`;
      tiposTempo.forEach(tt => {
        html += `<td>${t[tt.nome].toFixed(2)}</td>`;
      });
      html += "</tr>";
    }
  });

  html += "</tbody></table>";
  divResumo.innerHTML = html;
}

// Eventos para os selects
document.getElementById("selectPredio").addEventListener("change", filtrarDados);
document.getElementById("selectLinha").addEventListener("change", filtrarDados);
document.getElementById("selectPosto").addEventListener("change", filtrarDados);
