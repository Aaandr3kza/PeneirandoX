/*controla cadastro, login e logout das contas comuns*/

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const ambiente = require("../../config/environment");
const usuarioModel = require("../models/usuarioModel");
const { criarCookieAdmin, limparCookieAdmin } = require("../middlewares/adminAuth");

function criarToken(usuario) {
  return jwt.sign({ id: usuario.id }, ambiente.jwtSecret, { expiresIn: "7d" });
}

async function cadastrar(req, res, next) {
  try {
    const email = req.body.email;
    if (usuarioModel.buscarPorEmail(email)) {
      return res.status(409).json({ mensagem: "Já existe uma conta cadastrada com esse e-mail." });
    }

    const senhaHash = await bcrypt.hash(req.body.senha, 12);
    const usuario = {
      id: randomUUID(),
      email,
      senhaHash,
      role: "user",
      superAdmin: false,
      ativo: true,
      gender: req.body.gender,
      city: req.body.city,
      state: req.body.state,
      age: Number(req.body.age),
      sports: Array.isArray(req.body.sports) ? req.body.sports : [],
      favoritos: []
    };

    usuarioModel.adicionar(usuario);
    limparCookieAdmin(res);
    return res.status(201).json({
      mensagem: "Cadastro realizado com sucesso.",
      token: criarToken(usuario),
      usuario: usuarioModel.paraPublico(usuario)
    });
  } catch (erro) {
    return next(erro);
  }
}

async function login(req, res, next) {
  try {
    const usuario = usuarioModel.buscarPorEmail(req.body.email);
    if (!usuario || usuario.ativo === false || !(await bcrypt.compare(req.body.senha, usuario.senhaHash))) {
      return res.status(401).json({ mensagem: "E-mail ou senha incorretos." });
    }

    if (["admin", "superadmin"].includes(usuario.role)) {
      const tokenAdmin = jwt.sign(
        { id: usuario.id, tipo: "admin" },
        ambiente.jwtSecret,
        { expiresIn: Math.floor(ambiente.duracaoSessaoAdminMs / 1000) }
      );
      criarCookieAdmin(res, tokenAdmin);
    } else {
      limparCookieAdmin(res);
    }

    return res.json({
      mensagem: "Login realizado.",
      token: criarToken(usuario),
      usuario: usuarioModel.paraPublico(usuario)
    });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = { cadastrar, login };
