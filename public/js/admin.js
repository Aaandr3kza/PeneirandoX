/**
 * PENEIRANDOX — Controla as abas, formulários e tabelas do painel administrativo.
 */

(function () {
  "use strict";

  const superAdmin = document.body.dataset.superAdmin === "true";
  const estado = { times: [], usuarios: [], anuncios: [] };
  const $ = (id) => document.getElementById(id);

  async function requisicao(url, opcoes) {
    const config = Object.assign({ credentials: "same-origin" }, opcoes || {});
    config.headers = Object.assign({}, config.headers || {});
    if (config.body && typeof config.body !== "string") config.body = JSON.stringify(config.body);
    if (config.body && !config.headers["Content-Type"]) config.headers["Content-Type"] = "application/json";
    const resposta = await fetch(url, config);
    const dados = await resposta.json().catch(() => ({}));
    if (resposta.status === 401) {
      window.location.replace("/login");
      throw new Error("Sua sessão expirou. Entre novamente.");
    }
    if (!resposta.ok) {
      const detalhe = dados.erros && dados.erros.length ? " " + dados.erros.map((e) => e.msg).join(" ") : "";
      throw new Error((dados.mensagem || "Ocorreu um erro.") + detalhe);
    }
    return dados;
  }

  function elemento(tag, classe, texto) {
    const node = document.createElement(tag);
    if (classe) node.className = classe;
    if (texto !== undefined && texto !== null) node.textContent = String(texto);
    return node;
  }

  function feedback(id, mensagem, erro) {
    const alvo = $(id);
    alvo.textContent = mensagem;
    alvo.hidden = false;
    alvo.classList.toggle("erro", !!erro);
    window.setTimeout(() => { alvo.hidden = true; }, 5000);
  }

  function botaoAcao(texto, acao, id, classe) {
    const botao = elemento("button", "admin-btn-tabela " + (classe || ""), texto);
    botao.type = "button";
    botao.dataset.action = acao;
    botao.dataset.id = id;
    return botao;
  }

  function configurarAbas() {
    document.querySelectorAll("[data-aba]").forEach((botao) => {
      botao.addEventListener("click", () => {
        const aba = botao.dataset.aba;
        document.querySelectorAll("[data-aba]").forEach((item) => item.classList.toggle("ativa", item === botao));
        $("painel-times").hidden = aba !== "times";
        $("painel-usuarios").hidden = aba !== "usuarios";
        $("painel-anuncios").hidden = aba !== "anuncios";
      });
    });
  }

  async function carregarTimes() {
    estado.times = await requisicao("/api/admin/times");
    renderizarTimes();
  }

  function renderizarTimes() {
    const corpo = $("lista-times");
    corpo.replaceChildren();
    if (!estado.times.length) {
      const linha = elemento("tr");
      const celula = elemento("td", "admin-vazio", "Nenhum time cadastrado. Use “Novo time / seletiva” para adicionar o primeiro.");
      celula.colSpan = 5;
      linha.append(celula);
      corpo.append(linha);
      return;
    }

    estado.times.forEach((time) => {
      const linha = elemento("tr");
      const nome = elemento("td", "admin-time-nome");
      nome.append(elemento("strong", "", time.team_name), elemento("small", "", time.age_category || "Categoria não informada"));
      linha.append(nome, elemento("td", "", time.sport), elemento("td", "", (time.city || "—") + "/" + (time.state || "—")));
      const status = elemento("td");
      status.append(elemento("span", time.active ? "admin-status ativo" : "admin-status inativo", time.active ? "Ativa" : "Inativa"));
      linha.append(status);
      const acoes = elemento("td", "admin-acoes-tabela");
      acoes.append(botaoAcao("Editar", "editar-time", time.id), botaoAcao("Excluir", "excluir-time", time.id, "perigo"));
      linha.append(acoes);
      corpo.append(linha);
    });
  }

  function abrirFormularioTime(time) {
    const formulario = $("form-time");
    formulario.hidden = false;
    $("form-time-titulo").textContent = time ? "Editar time / seletiva" : "Novo time / seletiva";
    $("time-id").value = time ? time.id : "";
    $("time-nome").value = time ? time.team_name : "";
    $("time-esporte").value = time ? time.sport : "";
    $("time-cidade").value = time ? time.city : "";
    $("time-estado").value = time ? time.state : "";
    $("time-categoria").value = time ? time.age_category : "";
    $("time-datas").value = time ? time.dates : "";
    $("time-local").value = time ? time.short_location : "";
    $("time-escudo").value = time ? (time.emblem_url || "") : "";
    $("time-endereco").value = time ? time.address : "";
    $("time-lat").value = time && time.lat !== undefined ? time.lat : "";
    $("time-lng").value = time && time.lng !== undefined ? time.lng : "";
    $("time-descricao").value = time ? time.content_text : "";
    $("time-imagens").value = time && Array.isArray(time.content_images) ? time.content_images.join("\n") : "";
    $("time-links").value = time && Array.isArray(time.registration_links)
      ? time.registration_links.map((link) => link.label + " | " + link.url).join("\n") : "";
    $("time-destaque").checked = !!(time && time.featured);
    $("time-ativo").checked = !time || time.active !== false;
    formulario.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function fecharFormularioTime() {
    $("form-time").reset();
    $("time-id").value = "";
    $("form-time").hidden = true;
  }

  function linhas(texto) {
    return texto.split("\n").map((valor) => valor.trim()).filter(Boolean);
  }

  function montarDadosTime() {
    const links = linhas($("time-links").value).map((linha) => {
      const separador = linha.indexOf("|");
      if (separador === -1) throw new Error("Use o formato “Rótulo | URL” em cada linha de link.");
      return { label: linha.slice(0, separador).trim(), url: linha.slice(separador + 1).trim() };
    });
    return {
      team_name: $("time-nome").value.trim(),
      sport: $("time-esporte").value,
      city: $("time-cidade").value.trim(),
      state: $("time-estado").value,
      age_category: $("time-categoria").value.trim(),
      emblem_url: $("time-escudo").value.trim(),
      dates: $("time-datas").value.trim(),
      short_location: $("time-local").value.trim(),
      address: $("time-endereco").value.trim(),
      lat: $("time-lat").value === "" ? null : Number($("time-lat").value),
      lng: $("time-lng").value === "" ? null : Number($("time-lng").value),
      content_text: $("time-descricao").value.trim(),
      content_images: linhas($("time-imagens").value),
      registration_links: links,
      featured: $("time-destaque").checked,
      active: $("time-ativo").checked
    };
  }

  async function salvarTime(evento) {
    evento.preventDefault();
    try {
      const id = $("time-id").value;
      const dados = montarDadosTime();
      await requisicao(id ? "/api/admin/times/" + encodeURIComponent(id) : "/api/admin/times", {
        method: id ? "PUT" : "POST", body: dados
      });
      fecharFormularioTime();
      await carregarTimes();
      feedback("feedback-times", id ? "Registro atualizado." : "Registro criado.");
    } catch (erro) {
      feedback("feedback-times", erro.message, true);
    }
  }

  async function acaoTime(evento) {
    const botao = evento.target.closest("button[data-action]");
    if (!botao) return;
    const time = estado.times.find((item) => item.id === botao.dataset.id);
    if (botao.dataset.action === "editar-time" && time) abrirFormularioTime(time);
    if (botao.dataset.action === "excluir-time" && time && window.confirm("Excluir a seletiva de “" + time.team_name + "”? Esta alteração será gravada no JSON.")) {
      try {
        await requisicao("/api/admin/times/" + encodeURIComponent(time.id), { method: "DELETE" });
        await carregarTimes();
        feedback("feedback-times", "Registro excluído.");
      } catch (erro) { feedback("feedback-times", erro.message, true); }
    }
  }

  async function carregarUsuarios() {
    estado.usuarios = await requisicao("/api/admin/usuarios");
    renderizarUsuarios();
  }

  function renderizarUsuarios() {
    const corpo = $("lista-usuarios");
    corpo.replaceChildren();
    if (!estado.usuarios.length) {
      const linha = elemento("tr");
      const celula = elemento("td", "admin-vazio", "Ainda não existem contas cadastradas.");
      celula.colSpan = 5;
      linha.append(celula);
      corpo.append(linha);
      return;
    }

    estado.usuarios.forEach((usuario) => {
      const linha = elemento("tr");
      const conta = elemento("td", "admin-time-nome");
      conta.append(elemento("strong", "", usuario.email), elemento("small", "", usuario.id));
      linha.append(conta);
      const perfil = usuario.role === "superadmin" ? "Superadministrador" : (usuario.role === "admin" ? "Administrador" : "Usuário");
      linha.append(elemento("td", "", perfil));
      linha.append(elemento("td", "", usuario.city ? usuario.city + "/" + (usuario.state || "") : "Não informado"));
      const status = elemento("td");
      status.append(elemento("span", usuario.ativo === false ? "admin-status inativo" : "admin-status ativo", usuario.ativo === false ? "Desativada" : "Ativa"));
      linha.append(status);
      const acoes = elemento("td", "admin-acoes-tabela");
      acoes.append(botaoAcao("Editar", "editar-usuario", usuario.id));
      if (!["admin", "superadmin"].includes(usuario.role) || (superAdmin && usuario.role === "admin")) {
        acoes.append(botaoAcao("Excluir", "excluir-usuario", usuario.id, "perigo"));
      }
      linha.append(acoes);
      corpo.append(linha);
    });
  }

  function abrirFormularioUsuario(usuario) {
    $("form-usuario").hidden = false;
    $("usuario-id").value = usuario.id;
    $("usuario-email").value = usuario.email || "";
    $("usuario-genero").value = usuario.gender || "Outro";
    $("usuario-idade").value = usuario.age || "";
    $("usuario-cidade").value = usuario.city || "";
    $("usuario-estado").value = usuario.state || "SP";
    $("usuario-esportes").value = Array.isArray(usuario.sports) ? usuario.sports.join(", ") : "";
    $("usuario-ativo").checked = usuario.ativo !== false;
    $("form-usuario").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function fecharFormularioUsuario() {
    $("form-usuario").reset();
    $("usuario-id").value = "";
    $("form-usuario").hidden = true;
  }

  async function salvarUsuario(evento) {
    evento.preventDefault();
    const id = $("usuario-id").value;
    const dados = {
      email: $("usuario-email").value.trim(),
      gender: $("usuario-genero").value,
      age: Number($("usuario-idade").value),
      city: $("usuario-cidade").value.trim(),
      state: $("usuario-estado").value,
      sports: $("usuario-esportes").value.split(",").map((item) => item.trim()).filter(Boolean),
      ativo: $("usuario-ativo").checked
    };
    try {
      await requisicao("/api/admin/usuarios/" + encodeURIComponent(id), { method: "PUT", body: dados });
      fecharFormularioUsuario();
      await carregarUsuarios();
      feedback("feedback-usuarios", "Usuário atualizado.");
    } catch (erro) { feedback("feedback-usuarios", erro.message, true); }
  }

  async function acaoUsuario(evento) {
    const botao = evento.target.closest("button[data-action]");
    if (!botao) return;
    const usuario = estado.usuarios.find((item) => item.id === botao.dataset.id);
    if (!usuario) return;
    if (botao.dataset.action === "editar-usuario") abrirFormularioUsuario(usuario);
    if (botao.dataset.action === "excluir-usuario" && window.confirm("Excluir a conta “" + usuario.email + "”? Esta ação não pode ser desfeita.")) {
      try {
        await requisicao("/api/admin/usuarios/" + encodeURIComponent(usuario.id), { method: "DELETE" });
        await carregarUsuarios();
        feedback("feedback-usuarios", "Conta excluída.");
      } catch (erro) { feedback("feedback-usuarios", erro.message, true); }
    }
  }

  async function carregarAnuncios() {
    estado.anuncios = await requisicao("/api/admin/anuncios");
    renderizarAnuncios();
  }

  function renderizarAnuncios() {
    const corpo = $("lista-anuncios");
    corpo.replaceChildren();
    if (!estado.anuncios.length) {
      const linha = elemento("tr");
      const celula = elemento("td", "admin-vazio", "Nenhum anúncio cadastrado.");
      celula.colSpan = 5;
      linha.append(celula); corpo.append(linha); return;
    }
    estado.anuncios.forEach((anuncio) => {
      const linha = elemento("tr");
      const previa = elemento("td");
      const imagem = document.createElement("img");
      imagem.src = anuncio.imagem; imagem.alt = anuncio.titulo;
      imagem.className = "admin-anuncio-previa";
      previa.append(imagem);
      linha.append(previa, elemento("td", "", anuncio.titulo),
        elemento("td", "", anuncio.formato.charAt(0).toUpperCase() + anuncio.formato.slice(1)),
        elemento("td", "", anuncio.ativo === false ? "Inativo" : "Ativo"));
      const acoes = elemento("td", "admin-acoes-tabela");
      acoes.append(botaoAcao("Excluir", "excluir-anuncio", anuncio.id, "perigo"));
      linha.append(acoes); corpo.append(linha);
    });
  }

  async function salvarAnuncio(evento) {
    evento.preventDefault();
    const dados = {
      titulo: $("anuncio-titulo").value.trim(),
      formato: $("anuncio-formato").value,
      imagem: $("anuncio-imagem").value.trim(),
      ativo: $("anuncio-ativo").checked
    };
    try {
      await requisicao("/api/admin/anuncios", { method: "POST", body: dados });
      $("form-anuncio").reset();
      $("anuncio-ativo").checked = true;
      await carregarAnuncios();
      feedback("feedback-anuncios", "Anúncio cadastrado.");
    } catch (erro) { feedback("feedback-anuncios", erro.message, true); }
  }

  async function acaoAnuncio(evento) {
    const botao = evento.target.closest("button[data-action]");
    if (!botao || botao.dataset.action !== "excluir-anuncio") return;
    if (!window.confirm("Excluir este anúncio?")) return;
    try {
      await requisicao("/api/admin/anuncios/" + encodeURIComponent(botao.dataset.id), { method: "DELETE" });
      await carregarAnuncios();
      feedback("feedback-anuncios", "Anúncio excluído.");
    } catch (erro) { feedback("feedback-anuncios", erro.message, true); }
  }

  async function sair() {
    try { await requisicao("/api/admin/logout", { method: "POST" }); }
    finally { window.location.replace("/login"); }
  }

  function iniciar() {
    configurarAbas();
    $("btn-novo-time").addEventListener("click", () => abrirFormularioTime(null));
    $("cancelar-time").addEventListener("click", fecharFormularioTime);
    $("cancelar-time-rodape").addEventListener("click", fecharFormularioTime);
    $("form-time").addEventListener("submit", salvarTime);
    $("lista-times").addEventListener("click", acaoTime);
    $("cancelar-usuario").addEventListener("click", fecharFormularioUsuario);
    $("cancelar-usuario-rodape").addEventListener("click", fecharFormularioUsuario);
    $("form-usuario").addEventListener("submit", salvarUsuario);
    $("lista-usuarios").addEventListener("click", acaoUsuario);
    $("admin-sair").addEventListener("click", sair);

    $("form-anuncio").addEventListener("submit", salvarAnuncio);
    $("lista-anuncios").addEventListener("click", acaoAnuncio);

    Promise.all([carregarTimes(), carregarUsuarios(), carregarAnuncios()]).catch((erro) => {
      feedback("feedback-times", erro.message, true);
    });
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
