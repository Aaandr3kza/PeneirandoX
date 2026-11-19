/**
 * PENEIRANDOX — Controla a página inicial, pesquisa, filtros, favoritos e inicialização.
 */

/* PENEIRANDOX — páginas, filtros, navegação e inicialização.
   Depende de dados.js, carregado antes deste arquivo.
*/

/* ============================================================
   9. BOTÃO DE ADM INVISÍVEL — 3 cliques + 3 segundos
   ============================================================
   O botão existe no cabeçalho, mas está invisível (opacity: 0).
   Só abre o login administrativo quando o usuário clica 3 vezes seguidas
   e espera 3 segundos.
   ============================================================ */
/* ============================================================
   10. PÁGINA INICIAL (/)
   ============================================================ */
function initHome() {
  /* Atalhos de esporte (acima de "Destaques da semana") */
  desenharAtalhosEsporte();

  /* Busca do hero → leva para a página de pesquisar */
  var form = document.getElementById("form-busca");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var texto = document.getElementById("campo-hero").value.trim();
      window.location.href = "/pesquisar" + (texto ? "?q=" + encodeURIComponent(texto) : "");
    });
  }

  RENDER_ATUAL = function () {
    /* Destaques da semana */
    var destaques = SELETIVAS.filter(function (s) { return s.featured; });
    document.getElementById("sec-destaques").classList.toggle("escondido", destaques.length === 0);
    renderizarLista("lista-destaques", destaques, "Nenhum destaque por enquanto.");

    /* Seletivas recentes (as 6 primeiras) */
    var recentes = SELETIVAS.slice(0, 6);
    document.getElementById("sec-recentes").classList.toggle("escondido", recentes.length === 0);
    renderizarLista("lista-recentes", recentes, "Nenhuma seletiva cadastrada ainda.");

    /* Seções por esporte */
    var porEsporte = document.getElementById("secoes-esporte");
    porEsporte.innerHTML = ESPORTES.map(function (esporte) {
      var lista = SELETIVAS.filter(function (s) { return s.sport === esporte; });
      if (lista.length === 0) return "";
      return (
        '<section class="secao">' +
          '<div class="titulo-secao">' +
            "<h2>" + escaparHtml(esporte) + "</h2>" +
            '<a class="ver-todos" href="/pesquisar?sport=' + encodeURIComponent(esporte) + '">' +
              "Ver todos " + icone("arrow-right", "mini") +
            "</a>" +
          "</div>" +
          '<div class="cards">' + lista.slice(0, 4).map(cardHTML).join("") + "</div>" +
        "</section>"
      );
    }).join("");

    configurarCliquesCards("lista-destaques");
    configurarCliquesCards("lista-recentes");
    configurarCliquesCards("secoes-esporte");
  };

  RENDER_ATUAL();
}

/* ============================================================
   11. PÁGINA PESQUISAR (/pesquisar)
   ============================================================ */

/* Preenche um <select> de filtro com as opções */
function preencherSelect(id, opcoes, valorAtual, textoVazio) {
  var select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = '<option value="">' + (textoVazio || "Todos") + '</option>' +
    opcoes.map(function (o) {
      return '<option value="' + escaparHtml(o) + '"' + (o === valorAtual ? " selected" : "") + ">" + escaparHtml(o) + "</option>";
    }).join("");
}

/* Atualiza a URL com os filtros atuais (sem recarregar a página) */
function atualizarURL() {
  var partes = [];
  if (FILTROS.q) partes.push("q=" + encodeURIComponent(FILTROS.q));
  if (FILTROS.sport) partes.push("sport=" + encodeURIComponent(FILTROS.sport));
  if (FILTROS.state) partes.push("state=" + encodeURIComponent(FILTROS.state));
  if (FILTROS.age) partes.push("age=" + encodeURIComponent(FILTROS.age));
  if (FILTROS.ordem) partes.push("ordem=" + encodeURIComponent(FILTROS.ordem));
  var url = "/pesquisar" + (partes.length ? "?" + partes.join("&") : "");
  window.history.replaceState(null, "", url);
}

function initPesquisar() {
  /* Lê os filtros que vieram na URL (ex: /pesquisar?q=fla) */
  var params = new URLSearchParams(window.location.search);
  FILTROS.q = params.get("q") || "";
  FILTROS.sport = params.get("sport") || "";
  FILTROS.state = params.get("state") || "";
  FILTROS.age = params.get("age") || "";
  FILTROS.ordem = params.get("ordem") || "";

  /* Preenche os campos da tela */
  document.getElementById("campo-busca").value = FILTROS.q;
  preencherSelect("filtro-esporte", ESPORTES, FILTROS.sport);
  preencherSelect("filtro-estado", ESTADOS, FILTROS.state);
  preencherSelect("filtro-categoria", CATEGORIAS, FILTROS.age);
  document.getElementById("filtro-ordem").value = FILTROS.ordem;

  /* Abre/fecha o painel de filtros */
  var painel = document.getElementById("painel-filtros");
  var btnFiltros = document.getElementById("btn-filtros");
  btnFiltros.addEventListener("click", function () {
    painel.classList.toggle("escondido");
    btnFiltros.classList.toggle("ativo", !painel.classList.contains("escondido"));
  });

  /* Busca: atualiza a cada letra digitada */
  document.getElementById("campo-busca").addEventListener("input", function (e) {
    FILTROS.q = e.target.value;
    atualizarURL();
    RENDER_ATUAL();
  });

  /* Filtros: atualizam ao trocar a opção */
  document.getElementById("filtro-esporte").addEventListener("change", function (e) {
    FILTROS.sport = e.target.value;
    atualizarURL();
    RENDER_ATUAL();
  });
  document.getElementById("filtro-estado").addEventListener("change", function (e) {
    FILTROS.state = e.target.value;
    atualizarURL();
    RENDER_ATUAL();
  });
  document.getElementById("filtro-categoria").addEventListener("change", function (e) {
    FILTROS.age = e.target.value;
    atualizarURL();
    RENDER_ATUAL();
  });
  document.getElementById("filtro-ordem").addEventListener("change", function (e) {
    FILTROS.ordem = e.target.value;
    atualizarURL();
    RENDER_ATUAL();
  });

  /* Limpar filtros */
  document.getElementById("btn-limpar").addEventListener("click", function () {
    FILTROS = { q: "", sport: "", state: "", age: "", ordem: "" };
    document.getElementById("campo-busca").value = "";
    document.getElementById("filtro-esporte").value = "";
    document.getElementById("filtro-estado").value = "";
    document.getElementById("filtro-categoria").value = "";
    document.getElementById("filtro-ordem").value = "";
    atualizarURL();
    RENDER_ATUAL();
  });

  /* Redesenha a lista de resultados conforme os filtros */
  RENDER_ATUAL = function () {
    var termo = FILTROS.q.trim().toLowerCase();

    var lista = SELETIVAS.filter(function (s) {
      if (termo && s.team_name.toLowerCase().indexOf(termo) === -1) return false;
      if (FILTROS.sport && s.sport !== FILTROS.sport) return false;
      if (FILTROS.state && s.state !== FILTROS.state) return false;
      if (FILTROS.age && s.age_category !== FILTROS.age) return false;
      return true;
    });

    /* ============================================================
       "POR DISTÂNCIA"
       Compara a localização do usuário (cadastro) com a localização
       do time e mostra as mais próximas primeiro. A distância é
       aproximada (calculada pelo centro da cidade).
       ============================================================ */
    var minhasCoordenadas = coordenadasDoUsuario();
    var porDistancia = FILTROS.ordem === "distancia";

    lista.forEach(function (s) {
      s.distancia_km = (porDistancia && minhasCoordenadas)
        ? distanciaKm(minhasCoordenadas, coordenadasDe(s))
        : null;
    });

    if (porDistancia) {
      lista.sort(function (a, b) {
        var da = a.distancia_km == null ? Infinity : a.distancia_km;
        var db = b.distancia_km == null ? Infinity : b.distancia_km;
        return da - db;
      });
    }

    /* Aviso quando escolhem "Por distância" e não há cidade no cadastro */
    document.getElementById("aviso-local").classList.toggle("escondido", !(porDistancia && !minhasCoordenadas));

    /* Mostra quantas seletivas foram encontradas */
    document.getElementById("contador").textContent =
      lista.length + (lista.length === 1 ? " seletiva encontrada" : " seletivas encontradas") +
      (porDistancia ? " · mais próximas primeiro" : "");

    /* Mostra/esconde o botão "Limpar filtros" */
    var temFiltro = FILTROS.q || FILTROS.sport || FILTROS.state || FILTROS.age || FILTROS.ordem;
    document.getElementById("btn-limpar").classList.toggle("escondido", !temFiltro);
    btnFiltros.classList.toggle("ativo", !painel.classList.contains("escondido") || !!temFiltro);

    renderizarLista("lista-resultados", lista, "Nenhuma seletiva encontrada. Tente ajustar a busca ou os filtros.");
    configurarCliquesCards("lista-resultados");
  };

  RENDER_ATUAL();
}

/* ============================================================
   12. PÁGINA FAVORITOS (/favoritos)
   ============================================================ */
function initFavoritos() {
  RENDER_ATUAL = function () {
    var ids = lerFavoritos();

    /* Mantém a mesma ordem em que os favoritos foram salvos */
    var lista = ids
      .map(function (id) { return SELETIVAS.filter(function (s) { return s.id === id; })[0]; })
      .filter(Boolean);

    var container = document.getElementById("lista-favoritos");

    if (lista.length === 0) {
      container.innerHTML =
        '<div class="vazio">' +
          '<div class="vazio-icone">' + icone("heart", "grande") + "</div>" +
          '<p class="vazio-titulo">Nenhum favorito ainda</p>' +
          '<p class="vazio-texto">Toque no coração de uma seletiva para salvá-la aqui.</p>' +
          '<a class="vazio-botao" href="/pesquisar">' + icone("search") + " Buscar seletivas</a>" +
        "</div>";
      return;
    }

    container.innerHTML = '<div class="cards">' + lista.map(cardHTML).join("") + "</div>";
    configurarCliquesCards("lista-favoritos");
  };

  RENDER_ATUAL();
}

/* ============================================================
   13. INICIALIZAÇÃO
   ============================================================
   Roda quando a página termina de carregar:
   1. Carrega os dados do JSON
   2. Descobre qual é a página (pelo atributo data-page do <body>)
   3. Liga a lógica certa + o botão de ADM + o modal
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  var pagina = document.body.getAttribute("data-page");

  /* A tela de login/cadastro tem lógica própria e não precisa dos
     dados das seletivas */
  if (pagina === "login") {
    initLogin();
    return;
  }

  /* Quem não estiver logado é levado para o /login
     (a tela de login é a porta de entrada do site).
     A página de Perfil é a exceção: ela abre normalmente e mostra
     um convite para entrar, em vez de redirecionar. */
  if (!estaLogado() && pagina !== "perfil") {
    window.location.href = "/login";
    return;
  }

  var carregamento = estaLogado()
    ? Promise.all([carregarDados(), carregarFavoritos()])
    : carregarDados();

  carregamento.then(function () {
    if (pagina === "home") initHome();
    else if (pagina === "pesquisar") initPesquisar();
    else if (pagina === "favoritos") initFavoritos();
    else if (pagina === "perfil") initPerfil();

    configurarModal();
  }).catch(function (erro) {
    console.error("Não foi possível inicializar a página:", erro);
    window.location.href = "/login";
  });
});

/* ============================================================
   14. LOCALIZAÇÃO E DISTÂNCIA (filtro "Por distância")
   ============================================================
   As coordenadas das cidades ficam nesta tabela fixa (sem API).
   ------------------------------------------------------------------
   BANCO DE DADOS (futuro): quando o cadastro do usuário e o do time
   guardarem latitude/longitude, troque apenas `coordenadasDe()`
   para ler esses valores. O resto do site continua igual.
   ============================================================ */

/* Coordenadas aproximadas das capitais (usadas quando a cidade não
   está na lista de cidades abaixo) */
var CAPITAIS = {
  AC: [-9.974, -67.807], AL: [-9.665, -35.735], AP: [0.034, -51.066],
  AM: [-3.119, -60.021], BA: [-12.977, -38.501], CE: [-3.732, -38.527],
  DF: [-15.780, -47.929], ES: [-20.315, -40.312], GO: [-16.686, -49.264],
  MA: [-2.530, -44.303], MT: [-15.601, -56.097], MS: [-20.469, -54.620],
  MG: [-19.917, -43.934], PA: [-1.456, -48.503], PB: [-7.119, -34.845],
  PR: [-25.428, -49.273], PE: [-8.047, -34.877], PI: [-5.089, -42.802],
  RJ: [-22.907, -43.173], RN: [-5.794, -35.211], RS: [-30.035, -51.218],
  RO: [-8.761, -63.900], RR: [2.823, -60.675], SC: [-27.595, -48.548],
  SP: [-23.550, -46.633], SE: [-10.947, -37.073], TO: [-10.185, -48.333]
};

/* Cidades usadas pelo site (chave: "cidade|UF", sem acento e minúscula) */
var CIDADES = {
  "sao paulo|SP": [-23.5505, -46.6333],
  "rio de janeiro|RJ": [-22.9068, -43.1729],
  "sorocaba|SP": [-23.5015, -47.4526],
  "jaragua do sul|SC": [-26.4853, -49.0706],
  "belo horizonte|MG": [-19.9167, -43.9345],
  "goiania|GO": [-16.6869, -49.2648],
  "porto alegre|RS": [-30.0346, -51.2177],
  "florianopolis|SC": [-27.5954, -48.5480],
  "curitiba|PR": [-25.4284, -49.2733],
  "campinas|SP": [-22.9056, -47.0608],
  "santos|SP": [-23.9608, -46.3336],
  "jundiai|SP": [-23.1857, -46.8978]
};

/* Remove acentos e deixa tudo minúsculo (para comparar cidades) */
function semAcento(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/* Devolve [latitude, longitude] de um local {city, state} ou null */
function coordenadasDe(local) {
  if (!local) return null;

  /* Se já houver latitude/longitude salvas, elas mandam */
  if (typeof local.lat === "number" && typeof local.lng === "number") return [local.lat, local.lng];
  if (typeof local.latitude === "number" && typeof local.longitude === "number") {
    return [local.latitude, local.longitude];
  }

  var uf = String(local.state || "").trim().toUpperCase();
  var cidade = CIDADES[semAcento(local.city) + "|" + uf];
  if (cidade) return cidade;
  return CAPITAIS[uf] || null;
}

/* Distância em km entre dois pontos (fórmula de Haversine) */
function distanciaKm(a, b) {
  if (!a || !b) return null;
  var raio = 6371;
  var dLat = (b[0] - a[0]) * Math.PI / 180;
  var dLon = (b[1] - a[1]) * Math.PI / 180;
  var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * raio * Math.asin(Math.sqrt(h));
}

/* Texto da distância (ex: "~84 km") */
function formatarDistancia(km) {
  if (km == null) return "";
  if (km < 1) return "menos de 1 km";
  return "~" + Math.round(km) + " km";
}

