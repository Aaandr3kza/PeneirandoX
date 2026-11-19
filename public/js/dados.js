/**
 * PENEIRANDOX — Guarda constantes e funções compartilhadas para dados, favoritos, cards e modal.
 */

/* PENEIRANDOX — dados, favoritos, componentes e modal.
   Este arquivo reúne funções compartilhadas pelas páginas públicas.
*/

/* Oculta imagens ausentes sem precisar de JavaScript inline no HTML. */
window.addEventListener("error", function (e) {
  if (e.target && e.target.tagName === "IMG") e.target.style.visibility = "hidden";
}, true);

/* ============================================================
   PENEIRANDOX — LÓGICA DO SITE STANDALONE (JavaScript puro)
   ============================================================
   Este arquivo reúne dados e componentes compartilhados pelas
   páginas públicas do site:

     - /login      → <body data-page="login">     (entrar / criar conta)
     - /      → <body data-page="home">
     - /pesquisar  → <body data-page="pesquisar">
     - /favoritos  → <body data-page="favoritos">
     - /perfil     → <body data-page="perfil">

   O que este arquivo faz:
     1. Carrega os times e seletivas pela rota pública /api/times
     2. Monta os cards (uma única coluna, largura total)
     3. Consulta e atualiza favoritos no JSON do usuário
     4. Abre a janela (modal) de detalhe ao clicar em um card
     5. Controla o botão de ADM invisível (3 cliques + 3 segundos)
     6. Controla o login / criar conta e o perfil do atleta
     7. Calcula a distância entre o usuário e o time
     8. Desenha o gráfico de habilidades (radar) em SVG

   ------------------------------------------------------------------
   IMPORTANTE SOBRE OS ÍCONES E ESCUDOS
   ------------------------------------------------------------------
   Os ícones são imagens .png dentro da pasta  img/  (ex:
   img/icons/icon-trophy.png). Os escudos dos times também são .png
   (ex: img/time-01.png). Basta adicionar os arquivos .png com
   esses nomes na pasta img/ que eles aparecem automaticamente.
   Enquanto um .png não existir, a imagem fica invisível e, no caso
   do escudo, aparecem as iniciais do time no lugar.
   ============================================================ */

/* ============================================================
   1. CONFIGURAÇÃO E CONSTANTES
   ============================================================ */

/* Arquivo com os dados das seletivas (edite este arquivo para
   adicionar/alterar times). */
var DADOS_URL = "/api/times";

/* Chaves locais usadas para autenticação e cache dos dados básicos do perfil. */
var CHAVE_USUARIO = "peneirandox_usuario";     /* dados do cadastro */
var CHAVE_LOGADO = "peneirandox_logado";       /* compatibilidade com versões anteriores */
var CHAVE_TOKEN = "peneirandox_token";         /* token de autenticação da API */

/* Gêneros oferecidos no cadastro e no perfil */
var GENEROS = ["Masculino", "Feminino", "Outro"];

/* Critérios avaliados no gráfico de habilidades (radar) */
var CRITERIOS = ["Técnica", "Físico", "Tático", "Velocidade", "Finalização"];

/* ============================================================
   AVALIAÇÕES DOS TIMES (alimentam o gráfico de habilidades)
   ============================================================
   Ainda não existe nenhuma. Quando o formulário respondido pelos
   times (enviado por e-mail no dia da peneira) começar a alimentar
   o banco de dados, preencha esta lista com registros no formato:
     { sport: "Futebol", team_name: "Orion Azul FC", date: "2026-10-25",
       skills: { "Técnica": 8, "Físico": 7, "Tático": 6,
                 "Velocidade": 9, "Finalização": 7 } }
   ============================================================ */
var AVALIACOES = [];

/* Os 4 atalhos de esporte da página inicial.
   As imagens ficam em img/ (veja img/LEIA-ME.txt) */
var ATALHOS_ESPORTE = [
  { sport: "Futebol", imagem: "/img/esporte-futebol.png" },
  { sport: "Vôlei", imagem: "/img/esporte-volei.png" },
  { sport: "Futsal", imagem: "/img/esporte-futsal.png" },
  { sport: "Basquete", imagem: "/img/esporte-basquete.png" }
];

/* Listas usadas nos filtros da página Pesquisar
   (as mesmas do projeto em React) */
var ESPORTES = ["Futebol", "Futsal", "Basquete", "Vôlei", "Handebol"];
var ESTADOS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
var CATEGORIAS = ["Sub-11", "Sub-13", "Sub-15", "Sub-17", "Sub-20", "Livre"];

/* Cores de fundo do emblema quando o time não tem escudo (.png).
   A cor é escolhida a partir da primeira letra do id do time. */
var CORES_EMBLEMA = [
  "linear-gradient(135deg,#012B13,#39B54A)",
  "linear-gradient(135deg,#111111,#39B54A)",
  "linear-gradient(135deg,#39B54A,#012B13)",
  "linear-gradient(135deg,#012B13,#111111)"
];

/* ============================================================
   2. ESTADO (dados guardados enquanto a página está aberta)
   ============================================================ */
var SELETIVAS = []; /* todas as seletivas lidas do JSON */
var FILTROS = { q: "", sport: "", state: "", age: "", ordem: "" }; /* filtros da busca */
var ID_ABERTO = null; /* id da seletiva aberta no modal */
var RENDER_ATUAL = function () {}; /* função que redesenha a página atual */
var FAVORITOS_IDS = []; /* IDs carregados do JSON do usuário autenticado */
var FAVORITOS_EM_ATUALIZACAO = false; /* evita requisições concorrentes ao alternar */
var CONTAINERS_COM_CLIQUES = new WeakSet(); /* evita registrar eventos duplicados */

/* ============================================================
   3. FUNÇÕES AUXILIARES
   ============================================================ */

/* Cria a tag de imagem de um ícone da pasta img/
   Ex: icone("trophy")  →  <img class="icone" src="/img/icons/icon-trophy.png">
   O parâmetro "tamanho" é opcional: "mini", "pequeno" ou "grande" */
function icone(nome, tamanho) {
  var classe = tamanho ? "icone icone-" + tamanho : "icone";
  return '<img class="' + classe + '" src="/img/icons/icon-' + nome + '.png" alt="">';
}

/* Pega as iniciais de um nome. Ex: "Orion Azul FC" → "OA" */
function iniciais(nome) {
  var partes = String(nome || "").trim().split(/\s+/);
  if (partes.length === 0 || partes[0] === "") return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

/* Escolhe uma cor de emblema a partir do id do time */
function corDoId(id) {
  var indice = String(id).charCodeAt(0) % CORES_EMBLEMA.length;
  return CORES_EMBLEMA[indice];
}

/* Evita que caracteres especiais do texto quebrem o HTML */
function escaparHtml(texto) {
  return String(texto == null ? "" : texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ============================================================
   4. FAVORITOS (persistidos no JSON do usuário)
   ============================================================ */
function lerFavoritos() {
  return FAVORITOS_IDS.slice();
}

function ehFavorito(id) {
  return FAVORITOS_IDS.indexOf(id) !== -1;
}

async function carregarFavoritos() {
  var resposta = await requisicaoAPI("/api/me/favoritos");
  FAVORITOS_IDS = Array.isArray(resposta.favoritos) ? resposta.favoritos : [];
}

async function alternarFavorito(id) {
  if (FAVORITOS_EM_ATUALIZACAO) return;
  FAVORITOS_EM_ATUALIZACAO = true;
  var favoritos = lerFavoritos();
  var posicao = favoritos.indexOf(id);
  if (posicao !== -1) favoritos.splice(posicao, 1);
  else favoritos.push(id);

  try {
    var resposta = await requisicaoAPI("/api/me/favoritos", {
      method: "PUT",
      body: JSON.stringify({ favoritos: favoritos })
    });
    FAVORITOS_IDS = Array.isArray(resposta.favoritos) ? resposta.favoritos : [];
    RENDER_ATUAL();
    if (ID_ABERTO) abrirModal(ID_ABERTO);
  } catch (erro) {
    console.error("Não foi possível atualizar os favoritos:", erro);
    alert(erro.message || "Não foi possível salvar seus favoritos.");
  } finally {
    FAVORITOS_EM_ATUALIZACAO = false;
  }
}

/* ============================================================
   5. CARREGAR OS DADOS DO JSON
   ============================================================ */
function carregarDados() {
  return fetch(DADOS_URL)
    .then(function (resposta) { return resposta.json(); })
    .then(function (dados) {
      /* Só mostra seletivas ativas */
      SELETIVAS = dados.filter(function (s) { return s.active !== false; });
    })
    .catch(function (erro) {
      console.error("Erro ao carregar os times e seletivas:", erro);
      SELETIVAS = [];
    });
}

/* ============================================================
   6. MONTAGEM DOS CARDS
   ============================================================ */

/* Converte o nome da modalidade no nome do PNG correspondente. */
function slugEsporte(esporte) {
  return String(esporte || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* Monta o HTML de UM card de seletiva */
function cardHTML(s) {
  var fav = ehFavorito(s.id);

  return (
    '<article class="card" data-id="' + s.id + '">' +
      /* Botão de favorito (canto superior direito) */
      '<button class="card-fav ' + (fav ? "ativo" : "") + '" data-fav="' + s.id + '" ' +
        'aria-label="' + (fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos') + '">' +
        icone(fav ? "heart-filled" : "heart") +
      "</button>" +

      /* Emblema do time (círculo à esquerda) */
      '<div class="emblema" style="background:' + corDoId(s.id) + '">' +
        "<span>" + iniciais(s.team_name) + "</span>" +
        (s.emblem_url ? '<img src="' + escaparHtml(s.emblem_url) + '" alt="Escudo ' + escaparHtml(s.team_name) + '">' : "") +
      "</div>" +

      /* Informações do time (à direita do emblema) */
      '<div class="card-info">' +
        '<h3 class="card-titulo">' + escaparHtml(s.team_name) + "</h3>" +
        '<span class="card-esporte"><img class="icone-mini" src="/img/esporte-' + slugEsporte(s.sport) + '.png" alt=""> ' + escaparHtml(s.sport) + "</span>" +
        '<div class="card-detalhes">' +
          "<p><span><strong>" + escaparHtml(s.age_category) + "</strong></span></p>" +
          "<p><span>" + escaparHtml(s.city) + " - " + escaparHtml(s.state) + "</span></p>" +
          "<p><span>" + escaparHtml(s.dates) + "</span></p>" +
          /* Distância até você — só aparece no filtro "Por distância" */
          (s.distancia_km != null
            ? "<p><span><strong>" + formatarDistancia(s.distancia_km) + "</strong> de você</span></p>"
            : "") +
        "</div>" +
      "</div>" +
    "</article>"
  );
}

/* Monta a lista completa de cards (ou uma mensagem se estiver vazia) */
function listaHTML(lista, mensagemVazia) {
  if (!lista || lista.length === 0) {
    return '<div class="vazio"><p class="vazio-titulo">' + mensagemVazia + "</p></div>";
  }
  return '<div class="cards">' + lista.map(cardHTML).join("") + "</div>";
}

/* Escreve a lista dentro de um elemento da página */
function renderizarLista(idElemento, lista, mensagemVazia) {
  var el = document.getElementById(idElemento);
  if (el) el.innerHTML = listaHTML(lista, mensagemVazia);
}

/* ============================================================
   7. MODAL (janela de detalhe da seletiva)
   ============================================================ */

/* Monta TODO o HTML interno do modal para uma seletiva */
function conteudoModal(s) {
  var fav = ehFavorito(s.id);

  /* Endereço do mapa: usa as coordenadas (lat/lng) do JSON;
     se não existirem, usa o texto do endereço/local. */
  var consulta = (s.lat && s.lng)
    ? s.lat + "," + s.lng
    : encodeURIComponent(s.address || s.short_location || (s.city + " - " + s.state));
  var mapaSrc = "https://maps.google.com/maps?q=" + consulta + "&z=15&output=embed";

  /* Imagens do conteúdo (flyers, fotos...) */
  var imagens = (s.content_images || []).map(function (img) {
    return '<img src="' + escaparHtml(img) + '" alt="Imagem da seletiva">';
  }).join("");

  /* Links de inscrição (WhatsApp, formulários, editais...) */
  var links = (s.registration_links || []).map(function (l) {
    return '<a class="link-inscricao" href="' + escaparHtml(l.url) + '" target="_blank" rel="noopener">' +
      escaparHtml(l.label) + icone("link") +
    "</a>";
  }).join("");

  return (
    /* Botão fechar (X no canto superior direito) */
    '<button class="modal-fechar" onclick="fecharModal()" aria-label="Fechar">' +
      icone("close", "grande") +
    "</button>" +

    /* 1) EMBLEMA — quadrado, centralizado, 50% da largura */
    '<div class="modal-emblema" style="background:' + corDoId(s.id) + '">' +
      "<span>" + iniciais(s.team_name) + "</span>" +
      (s.emblem_url ? '<img src="' + escaparHtml(s.emblem_url) + '" alt="Escudo ' + escaparHtml(s.team_name) + '">' : "") +
    "</div>" +

    /* 2) NOME DO TIME — alinhado à esquerda */
    '<h2 class="modal-time">' + escaparHtml(s.team_name) + "</h2>" +

    /* 3) INFORMAÇÕES RÁPIDAS — parecidas com as do card */
    '<div class="modal-rapido">' +
      "<p>" + icone("trophy") + "<strong>" + escaparHtml(s.age_category) + "</strong></p>" +
      "<p>" + icone("trophy") + escaparHtml(s.sport) + "</p>" +
      "<p>" + icone("pin") + escaparHtml(s.city) + " - " + escaparHtml(s.state) + "</p>" +
      "<p>" + icone("calendar") + escaparHtml(s.dates) + "</p>" +
    "</div>" +

    /* Botão de favoritar */
    '<button class="modal-fav ' + (fav ? "ativo" : "") + '" data-fav="' + s.id + '">' +
      icone(fav ? "heart-filled" : "heart") +
      (fav ? " Remover dos favoritos" : " Adicionar aos favoritos") +
    "</button>" +

    /* 4) IMAGEM e depois TEXTO */
    '<div class="modal-imagens">' + imagens + "</div>" +
    '<p class="modal-texto">' + escaparHtml(s.content_text || "Sem informações em texto.") + "</p>" +

    /* 5) MAPA DA LOCALIZAÇÃO EXATA */
    '<div class="modal-mapa">' +
      '<iframe src="' + mapaSrc + '" loading="lazy" title="Localização da seletiva"></iframe>' +
    "</div>" +
    '<p class="modal-endereco">' + icone("pin", "pequeno") + " " +
      escaparHtml(s.address || s.short_location || "") + "</p>" +

    /* Links de inscrição */
    '<div class="modal-links">' +
      "<h3>" + icone("link") + " Inscreva-se</h3>" +
      (links || '<p class="texto-vazio">Sem links de inscrição cadastrados.</p>') +
    "</div>"
  );
}

/* Abre o modal com os dados de uma seletiva */
function abrirModal(id) {
  var s = SELETIVAS.filter(function (x) { return x.id === id; })[0];
  if (!s) return;

  ID_ABERTO = id;
  document.getElementById("modal-box").innerHTML = conteudoModal(s);
  document.getElementById("modal").classList.remove("escondido");

  /* Trava a rolagem do fundo enquanto o modal está aberto */
  document.body.style.overflow = "hidden";
}

/* Fecha o modal */
function fecharModal() {
  ID_ABERTO = null;
  document.getElementById("modal").classList.add("escondido");
  document.getElementById("modal-box").innerHTML = "";
  document.body.style.overflow = "";
}

/* Liga os cliques: fundo escuro fecha, tecla ESC fecha,
   e o botão de favorito dentro do modal funciona. */
function configurarModal() {
  var overlay = document.getElementById("modal");
  if (!overlay) return;

  /* Clicar FORA da caixa (no fundo escuro) fecha */
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) fecharModal();
  });

  /* Tecla ESC fecha */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") fecharModal();
  });

  /* Botão de favorito dentro do modal */
  document.getElementById("modal-box").addEventListener("click", function (e) {
    var botao = e.target.closest("[data-fav]");
    if (botao) alternarFavorito(botao.getAttribute("data-fav"));
  });
}

/* ============================================================
   8. CLIQUES NOS CARDS (abre o modal; coração favorita)
   ============================================================ */
function configurarCliquesCards(containerId) {
  var container = document.getElementById(containerId);
  if (!container || CONTAINERS_COM_CLIQUES.has(container)) return;
  CONTAINERS_COM_CLIQUES.add(container);

  container.addEventListener("click", function (e) {
    /* Clicou no coração? Apenas favorita/desfavorita */
    var coracao = e.target.closest("[data-fav]");
    if (coracao) {
      e.stopPropagation();
      alternarFavorito(coracao.getAttribute("data-fav"));
      return;
    }

    /* Clicou em qualquer outra parte do card? Abre o modal */
    var card = e.target.closest(".card");
    if (card) abrirModal(card.getAttribute("data-id"));
  });
}

