/**
 * PENEIRANDOX — Controla autenticação, dados do atleta, perfil e gráfico de habilidades.
 */

/* PENEIRANDOX — autenticação, perfil e gráficos do atleta.
   Depende das funções e variáveis globais dos arquivos anteriores.
*/

/* ============================================================
   15. USUÁRIO — autenticação e dados pela API Express
   ============================================================ */

/* Faz requisições ao backend e envia o token quando existir. */
async function requisicaoAPI(caminho, opcoes) {
  opcoes = opcoes || {};
  var cabecalhos = Object.assign({ "Content-Type": "application/json" }, opcoes.headers || {});
  var token = localStorage.getItem(CHAVE_TOKEN);
  if (token) cabecalhos.Authorization = "Bearer " + token;

  var resposta = await fetch(caminho, Object.assign({}, opcoes, { headers: cabecalhos }));
  var dados = await resposta.json().catch(function () { return {}; });
  if (!resposta.ok) {
    var mensagem = dados.mensagem || (dados.erros && dados.erros.map(function (e) { return e.msg; }).join(". ")) || "Não foi possível concluir a operação.";
    throw new Error(mensagem);
  }
  return dados;
}

function lerUsuario() {
  try { return JSON.parse(localStorage.getItem(CHAVE_USUARIO) || "null") || {}; }
  catch (e) { return {}; }
}

/* Mantém uma cópia dos dados básicos para o funcionamento do frontend. */
function salvarUsuario(dados) {
  var novo = Object.assign({}, lerUsuario(), dados);
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(novo));
  return novo;
}

function estaLogado() {
  return !!localStorage.getItem(CHAVE_TOKEN);
}

function entrarNoSite() {
  window.location.href = "/";
}

function sair() {
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_LOGADO);
  localStorage.removeItem(CHAVE_USUARIO);
  window.location.href = "/login";
}

/* O perfil está completo quando tem localização e idade */
function perfilCompleto(u) {
  return !!(u && u.city && u.state && u.age);
}

/* Coordenadas do usuário (usadas no filtro "Por distância") */
function coordenadasDoUsuario() {
  return coordenadasDe(lerUsuario());
}

/* ============================================================
   16. CHIPS DE ESPORTE (escolha de vários esportes)
   ============================================================ */

/* Desenha os botões de escolha dos esportes dentro de uma caixa */
function montarChips(idCaixa, escolhidos) {
  var caixa = document.getElementById(idCaixa);
  if (!caixa) return;

  caixa.innerHTML = ESPORTES.map(function (esporte) {
    var ativo = escolhidos.indexOf(esporte) !== -1;
    return '<button type="button" class="chip' + (ativo ? " ativo" : "") + '" data-esporte="' +
      escaparHtml(esporte) + '">' + escaparHtml(esporte) + "</button>";
  }).join("");
}

/* Liga os cliques dos chips (marca/desmarca o esporte e redesenha) */
function ligarChips(idCaixa, escolhidos, aoMudar) {
  var caixa = document.getElementById(idCaixa);
  if (!caixa) return;

  caixa.addEventListener("click", function (e) {
    var botao = e.target.closest("[data-esporte]");
    if (!botao) return;

    var esporte = botao.getAttribute("data-esporte");
    var posicao = escolhidos.indexOf(esporte);
    if (posicao === -1) escolhidos.push(esporte);
    else escolhidos.splice(posicao, 1);

    montarChips(idCaixa, escolhidos);
    if (aoMudar) aoMudar();
  });
}

/* Escreve a mensagem de erro (ou esconde, quando estiver vazia) */
function mostrarErro(id, mensagem) {
  var caixa = document.getElementById(id);
  if (!caixa) return;
  caixa.textContent = mensagem || "";
  caixa.classList.toggle("escondido", !mensagem);
}

/* ============================================================
   17. PÁGINA ENTRAR / CRIAR CONTA (/login)
   ============================================================ */
function initLogin() {
  preencherSelect("criar-genero", GENEROS, "", "Selecione");
  preencherSelect("criar-estado", ESTADOS, "", "UF");

  var esportesEscolhidos = [];
  montarChips("criar-chips", esportesEscolhidos);
  ligarChips("criar-chips", esportesEscolhidos, null);

  var abaEntrar = document.getElementById("aba-entrar");
  var abaCriar = document.getElementById("aba-criar");
  var formEntrar = document.getElementById("form-entrar");
  var formCriar = document.getElementById("form-criar");
  var titulo = document.getElementById("login-titulo");
  var sub = document.getElementById("login-sub");

  function mostrarAba(qual) {
    var entrando = qual === "entrar";
    abaEntrar.classList.toggle("ativo", entrando);
    abaCriar.classList.toggle("ativo", !entrando);
    formEntrar.classList.toggle("escondido", !entrando);
    formCriar.classList.toggle("escondido", entrando);
    titulo.textContent = entrando ? "Entrar" : "Criar conta";
    sub.textContent = entrando ? "Acesse para ver as seletivas mais perto de você" : "Leva menos de um minuto";
    mostrarErro("erro-entrar", "");
    mostrarErro("erro-criar", "");
  }

  abaEntrar.addEventListener("click", function () { mostrarAba("entrar"); });
  abaCriar.addEventListener("click", function () { mostrarAba("criar"); });

  formEntrar.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    var email = document.getElementById("login-email").value.trim();
    var senha = document.getElementById("login-senha").value;
    mostrarErro("erro-entrar", "");
    if (!email || !senha) { mostrarErro("erro-entrar", "Informe e-mail e senha."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { mostrarErro("erro-entrar", "Informe um e-mail válido."); return; }

    var botao = document.getElementById("btn-entrar");
    botao.disabled = true;
    try {
      var resultado = await requisicaoAPI("/api/login", {
        method: "POST", body: JSON.stringify({ email: email, senha: senha })
      });
      localStorage.setItem(CHAVE_TOKEN, resultado.token);
      localStorage.setItem(CHAVE_USUARIO, JSON.stringify(resultado.usuario));
      entrarNoSite();
    } catch (erro) {
      mostrarErro("erro-entrar", erro.message);
    } finally { botao.disabled = false; }
  });

  formCriar.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    var email = document.getElementById("criar-email").value.trim();
    var senha = document.getElementById("criar-senha").value;
    var confirma = document.getElementById("criar-confirma").value;
    var genero = document.getElementById("criar-genero").value;
    var cidade = document.getElementById("criar-cidade").value.trim();
    var estado = document.getElementById("criar-estado").value;
    var idade = Number(document.getElementById("criar-idade").value);
    mostrarErro("erro-criar", "");

    if (!email || !senha || !confirma || !genero || !cidade || !estado || !document.getElementById("criar-idade").value) {
      mostrarErro("erro-criar", "Preencha todos os campos obrigatórios."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { mostrarErro("erro-criar", "Informe um e-mail válido."); return; }
    if (senha.length < 8) { mostrarErro("erro-criar", "A senha deve ter pelo menos 8 caracteres."); return; }
    if (senha !== confirma) { mostrarErro("erro-criar", "As senhas não conferem."); return; }
    if (!Number.isInteger(idade) || idade < 8 || idade > 99) { mostrarErro("erro-criar", "A idade deve ser um número inteiro entre 8 e 99."); return; }

    var botao = document.getElementById("btn-criar");
    botao.disabled = true;
    try {
      var resultado = await requisicaoAPI("/api/cadastro", {
        method: "POST",
        body: JSON.stringify({ email: email, senha: senha, gender: genero, city: cidade, state: estado, age: idade, sports: esportesEscolhidos })
      });
      localStorage.setItem(CHAVE_TOKEN, resultado.token);
      localStorage.setItem(CHAVE_USUARIO, JSON.stringify(resultado.usuario));
      entrarNoSite();
    } catch (erro) {
      mostrarErro("erro-criar", erro.message);
    } finally { botao.disabled = false; }
  });
}

/* ============================================================
   18. PÁGINA PERFIL (/perfil)
   ============================================================ */
async function initPerfil() {
  var logado = estaLogado();

  /* Sem login: mostra o convite para entrar no lugar do perfil */
  document.getElementById("perfil-deslogado").classList.toggle("escondido", logado);
  document.getElementById("perfil-conteudo").classList.toggle("escondido", !logado);

  if (!logado) return;

  var usuario = lerUsuario();
  try {
    var respostaUsuario = await requisicaoAPI("/api/me");
    usuario = respostaUsuario.usuario;
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
  } catch (erro) {
    sair();
    return;
  }

  /* Dados da conta */
  document.getElementById("perfil-email").textContent = usuario.email || "—";

  /* Preenche o formulário com o que já estava salvo */
  preencherSelect("perfil-genero", GENEROS, usuario.gender || "", "Selecione");
  preencherSelect("perfil-estado", ESTADOS, usuario.state || "", "Selecione");
  document.getElementById("perfil-idade").value = usuario.age || "";
  document.getElementById("perfil-cidade").value = usuario.city || "";

  var escolhidos = Array.isArray(usuario.sports) ? usuario.sports.slice() : [];
  montarChips("perfil-chips", escolhidos);

  function atualizar() {
    montarChips("perfil-chips", escolhidos);
    desenharHabilidades(escolhidos);
    document.getElementById("dica-perfil").classList.toggle("escondido", perfilCompleto(lerUsuario()));
  }

  ligarChips("perfil-chips", escolhidos, atualizar);

  /* Salvar alterações */
  document.getElementById("btn-salvar-perfil").addEventListener("click", async function () {
    var dados = {
      gender: document.getElementById("perfil-genero").value,
      age: Number(document.getElementById("perfil-idade").value),
      city: document.getElementById("perfil-cidade").value.trim(),
      state: document.getElementById("perfil-estado").value,
      sports: escolhidos
    };
    if (!dados.gender || !dados.city || !dados.state || !Number.isInteger(dados.age) || dados.age < 8 || dados.age > 99) {
      alert("Preencha gênero, cidade, estado e uma idade entre 8 e 99 anos.");
      return;
    }
    var botao = document.getElementById("btn-salvar-perfil");
    botao.disabled = true;
    try {
      var resposta = await requisicaoAPI("/api/me", { method: "PUT", body: JSON.stringify(dados) });
      salvarUsuario(resposta.usuario);
      var aviso = document.getElementById("aviso-perfil");
      aviso.textContent = "Perfil salvo no servidor!";
      aviso.classList.remove("escondido");
      setTimeout(function () { aviso.classList.add("escondido"); }, 2500);
      atualizar();
    } catch (erro) {
      alert(erro.message);
    } finally { botao.disabled = false; }
  });

  /* Sair da conta */
  document.getElementById("btn-sair").addEventListener("click", sair);

  /* Primeira montagem da tela */
  atualizar();
}

/* Desenha o gráfico de habilidades de cada esporte escolhido */
function desenharHabilidades(esportes) {
  var caixa = document.getElementById("lista-habilidades");
  if (!caixa) return;

  if (!esportes || esportes.length === 0) {
    caixa.innerHTML = '<p class="habilidade-caixa-vazia">Escolha seus esportes de preferência para ver o gráfico</p>';
    return;
  }

  caixa.innerHTML = esportes.map(function (esporte) {
    var avaliacoes = AVALIACOES.filter(function (a) { return a.sport === esporte; });

    return (
      '<div class="habilidade">' +
        '<h3 class="habilidade-titulo">' + icone("trophy", "pequeno") + escaparHtml(esporte) + "</h3>" +
        desenharRadar(avaliacoes) +
        (avaliacoes.length === 0
          ? '<p class="habilidade-vazio">Nenhuma avaliação recebida ainda</p>'
          : '<p class="habilidade-media">Média de ' + avaliacoes.length + ' avaliação(ões) · escala de 0 a 10</p>') +
      "</div>"
    );
  }).join("");
}

/* ============================================================
   19. GRÁFICO DE RADAR (SVG desenhado à mão, sem bibliotecas)
   ============================================================ */
function desenharRadar(avaliacoes) {
  var tamanho = 240;
  var centro = tamanho / 2;
  var raio = centro - 42;
  var total = CRITERIOS.length;

  /* Posição de um ponto: a nota (0 a 10) vira distância do centro */
  function ponto(indice, valor) {
    var angulo = -Math.PI / 2 + (indice * 2 * Math.PI) / total;
    var distancia = (raio * Math.max(0, Math.min(10, valor))) / 10;
    return [
      (centro + distancia * Math.cos(angulo)).toFixed(1),
      (centro + distancia * Math.sin(angulo)).toFixed(1)
    ];
  }

  var svg = '<svg class="radar" viewBox="0 0 ' + tamanho + " " + tamanho + '" role="img">';

  /* Grade (4 anéis) */
  [2.5, 5, 7.5, 10].forEach(function (nivel) {
    var anel = CRITERIOS.map(function (_, i) { return ponto(i, nivel).join(","); }).join(" ");
    svg += '<polygon points="' + anel + '" fill="none" stroke="rgba(1,43,19,0.15)" stroke-width="1"></polygon>';
  });

  /* Linhas dos eixos e nomes dos critérios */
  CRITERIOS.forEach(function (criterio, i) {
    var fim = ponto(i, 10);
    svg += '<line x1="' + centro + '" y1="' + centro + '" x2="' + fim[0] + '" y2="' + fim[1] +
      '" stroke="rgba(1,43,19,0.12)" stroke-width="1"></line>';

    var pos = ponto(i, 12.6);
    var ancora = "middle";
    if (Number(pos[0]) > centro + 4) ancora = "start";
    if (Number(pos[0]) < centro - 4) ancora = "end";

    svg += '<text x="' + pos[0] + '" y="' + (Number(pos[1]) + 4) + '" text-anchor="' + ancora +
      '" font-size="11" font-weight="700" fill="rgba(1,43,19,0.7)">' + escaparHtml(criterio) + "</text>";
  });

  /* Polígono com as médias (só quando já existem avaliações) */
  if (avaliacoes.length > 0) {
    var pontos = CRITERIOS.map(function (criterio, i) {
      var notas = avaliacoes.map(function (a) {
        return Number(a.skills ? a.skills[criterio] : NaN);
      }).filter(function (n) { return !isNaN(n); });

      var media = notas.length
        ? notas.reduce(function (soma, n) { return soma + n; }, 0) / notas.length
        : 0;

      return ponto(i, media).join(",");
    }).join(" ");

    svg += '<polygon points="' + pontos + '" fill="rgba(57,181,74,0.45)" stroke="#012B13" stroke-width="2"></polygon>';
  }

  return svg + "</svg>";
}

/* ============================================================
   20. ATALHOS DE ESPORTE (página inicial)
   ============================================================
   Quatro botões, um embaixo do outro, com a imagem à esquerda,
   que levam para a Pesquisa já com o filtro do esporte. */
function desenharAtalhosEsporte() {
  var caixa = document.getElementById("atalhos-esporte");
  if (!caixa) return;

  caixa.innerHTML = ATALHOS_ESPORTE.map(function (item) {
    return (
      '<a class="atalho" href="/pesquisar?sport=' + encodeURIComponent(item.sport) + '">' +
        '<span class="atalho-img">' +
          /* Ícone que aparece no lugar quando a imagem do esporte não existe */
          icone("trophy", "grande") +
          '<img class="atalho-foto" src="' + item.imagem + '" alt="' + escaparHtml(item.sport) + '">' +
        "</span>" +
        '<span class="atalho-nome">' + escaparHtml(item.sport) + "</span>" +
        icone("arrow-right", "pequeno") +
      "</a>"
    );
  }).join("");
}
