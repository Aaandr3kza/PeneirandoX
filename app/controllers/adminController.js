/*Recebe as ações do painel administrativo e coordena modelos e respostas da API*/

const { randomUUID } = require("crypto");
const usuarioModel = require("../models/usuarioModel");
const anuncioModel = require("../models/anuncioModel");
const timeModel = require("../models/timeModel");
const { limparCookieAdmin } = require("../middlewares/adminAuth");

function logout(req, res) {
  limparCookieAdmin(res);
  return res.json({ mensagem: "Sessão administrativa encerrada." });
}

function obterSessao(req, res) {
  return res.json({ admin: usuarioModel.paraPublico(req.admin) });
}

function listarTimes(req, res) {
  return res.json(timeModel.lerTodos());
}

function normalizarTime(dados) {
  const time = {
    team_name: dados.team_name.trim(),
    sport: dados.sport,
    city: dados.city.trim(),
    state: dados.state,
    age_category: dados.age_category.trim(),
    emblem_url: (dados.emblem_url || "").trim(),
    dates: dados.dates.trim(),
    short_location: dados.short_location.trim(),
    address: dados.address.trim(),
    content_text: dados.content_text.trim(),
    content_images: dados.content_images || [],
    registration_links: dados.registration_links || [],
    featured: dados.featured === true,
    active: dados.active === true
  };
  if (dados.lat !== undefined && dados.lat !== null && dados.lat !== "") time.lat = Number(dados.lat);
  if (dados.lng !== undefined && dados.lng !== null && dados.lng !== "") time.lng = Number(dados.lng);
  return time;
}

function criarTime(req, res) {
  const novo = { id: randomUUID(), ...normalizarTime(req.body) };
  timeModel.adicionar(novo);
  return res.status(201).json({ mensagem: "Time/seletiva criado com sucesso.", time: novo });
}

function atualizarTime(req, res) {
  const atualizado = timeModel.atualizar(req.params.id, normalizarTime(req.body));
  if (!atualizado) return res.status(404).json({ mensagem: "Time/seletiva não encontrado." });
  return res.json({ mensagem: "Time/seletiva atualizado com sucesso.", time: atualizado });
}

function excluirTime(req, res) {
  if (!timeModel.remover(req.params.id)) return res.status(404).json({ mensagem: "Time/seletiva não encontrado." });
  return res.json({ mensagem: "Time/seletiva removido com sucesso." });
}

function listarUsuarios(req, res) {
  const usuarios = usuarioModel.lerTodos().map(usuarioModel.paraPublico);
  return res.json(usuarios);
}

function atualizarUsuario(req, res) {
  const existente = usuarioModel.buscarPorId(req.params.id);
  if (!existente) return res.status(404).json({ mensagem: "Usuário não encontrado." });
  if (["admin", "superadmin"].includes(existente.role) && existente.id !== req.admin.id && req.admin.role !== "superadmin") {
    return res.status(403).json({ mensagem: "Somente o administrador principal pode editar outras contas administrativas." });
  }
  if (existente.id === req.admin.id && req.body.ativo === false) {
    return res.status(400).json({ mensagem: "Você não pode desativar a própria conta enquanto está conectado." });
  }
  if (existente.superAdmin === true && req.body.ativo === false) {
    return res.status(400).json({ mensagem: "A conta do administrador principal não pode ser desativada." });
  }

  const email = req.body.email;
  const outroComEmail = usuarioModel.buscarPorEmail(email);
  if (outroComEmail && outroComEmail.id !== existente.id) {
    return res.status(409).json({ mensagem: "Este e-mail já está sendo usado por outra conta." });
  }

  // A edição de perfil não altera role, superAdmin ou senhaHash.
  const atualizado = usuarioModel.atualizar(req.params.id, {
    email,
    gender: req.body.gender,
    city: req.body.city.trim(),
    state: req.body.state,
    age: Number(req.body.age),
    sports: req.body.sports,
    ativo: req.body.ativo === true
  });
  return res.json({ mensagem: "Usuário atualizado com sucesso.", usuario: usuarioModel.paraPublico(atualizado) });
}

function excluirUsuario(req, res) {
  const existente = usuarioModel.buscarPorId(req.params.id);
  if (!existente) return res.status(404).json({ mensagem: "Usuário não encontrado." });
  if (existente.id === req.admin.id) return res.status(400).json({ mensagem: "Você não pode excluir a própria conta por este painel." });
  if (existente.superAdmin === true) return res.status(403).json({ mensagem: "A conta do administrador principal não pode ser excluída por aqui." });
  if (["admin", "superadmin"].includes(existente.role) && req.admin.role !== "superadmin") {
    return res.status(403).json({ mensagem: "Somente o administrador principal pode excluir outro administrador." });
  }
  usuarioModel.salvarTodos(usuarioModel.lerTodos().filter((usuario) => usuario.id !== existente.id));
  return res.json({ mensagem: "Usuário excluído com sucesso." });
}


function listarAnuncios(req, res) {
  return res.json(anuncioModel.lerTodos());
}
function criarAnuncio(req, res) {
  const novo = anuncioModel.adicionar({
    id: randomUUID(),
    titulo: req.body.titulo.trim(),
    formato: req.body.formato,
    imagem: req.body.imagem.trim(),
    ativo: req.body.ativo !== false,
    criadoEm: new Date().toISOString()
  });
  return res.status(201).json({ mensagem: "Anúncio cadastrado.", anuncio: novo });
}
function excluirAnuncio(req, res) {
  if (!anuncioModel.remover(req.params.id)) return res.status(404).json({ mensagem: "Anúncio não encontrado." });
  return res.json({ mensagem: "Anúncio excluído." });
}

module.exports = {
  logout,
  obterSessao,
  listarTimes,
  criarTime,
  atualizarTime,
  excluirTime,
  listarUsuarios,
  atualizarUsuario,
  excluirUsuario,
  listarAnuncios,
  criarAnuncio,
  excluirAnuncio
};
