/*consulta e atualiza os dados do perfil do usuário autenticado*/

const usuarioModel = require("../models/usuarioModel");
const timeModel = require("../models/timeModel");

function obterPerfil(req, res) {
  return res.json({ usuario: usuarioModel.paraPublico(req.usuario) });
}

function obterFavoritos(req, res) {
  const favoritos = Array.isArray(req.usuario.favoritos) ? req.usuario.favoritos : [];
  return res.json({ favoritos });
}

function atualizarFavoritos(req, res) {
  if (!Array.isArray(req.body.favoritos)) {
    return res.status(400).json({ mensagem: "A lista de favoritos é inválida." });
  }
  const idsValidos = new Set(timeModel.lerTodos().map((time) => time.id));
  const favoritos = [...new Set(req.body.favoritos.filter(
    (id) => typeof id === "string" && idsValidos.has(id)
  ))];
  const usuario = usuarioModel.atualizar(req.usuario.id, { favoritos });
  return res.json({ favoritos: usuario.favoritos });
}

function atualizarPerfil(req, res, next) {
  try {
    const usuario = usuarioModel.atualizar(req.usuario.id, {
      gender: req.body.gender,
      city: req.body.city,
      state: req.body.state,
      age: Number(req.body.age),
      sports: req.body.sports
    });

    if (!usuario) {
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    }

    return res.json({ mensagem: "Perfil atualizado.", usuario: usuarioModel.paraPublico(usuario) });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = { obterPerfil, atualizarPerfil, obterFavoritos, atualizarFavoritos };
