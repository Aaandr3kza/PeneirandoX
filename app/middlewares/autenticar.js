/*verifica se a requisição pertence a um usuário comum autenticado*/

const jwt = require("jsonwebtoken");
const ambiente = require("../../config/environment");
const usuarioModel = require("../models/usuarioModel");

function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || "";
  const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7) : "";

  if (!token) return res.status(401).json({ mensagem: "Faça login para continuar." });

  try {
    const payload = jwt.verify(token, ambiente.jwtSecret);
    const usuario = usuarioModel.buscarPorId(payload.id);
    if (!usuario || usuario.ativo === false) {
      return res.status(401).json({ mensagem: "Usuário não encontrado ou conta desativada." });
    }
    req.usuario = usuario;
    return next();
  } catch (erro) {
    return res.status(401).json({ mensagem: "Sessão inválida ou expirada. Entre novamente." });
  }
}

module.exports = autenticar;
