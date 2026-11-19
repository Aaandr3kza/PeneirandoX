/* Sessão administrativa baseada no mesmo usuarios.json usado pelo login comum. */
const jwt = require("jsonwebtoken");
const ambiente = require("../../config/environment");
const usuarioModel = require("../models/usuarioModel");

const NOME_COOKIE_ADMIN = "peneirandox_admin";

function lerCookie(req, nome) {
  const linha = req.headers.cookie || "";
  for (const parte of linha.split(";")) {
    const separador = parte.indexOf("=");
    if (separador === -1) continue;
    if (parte.slice(0, separador).trim() === nome) {
      return decodeURIComponent(parte.slice(separador + 1).trim());
    }
  }
  return "";
}

function criarCookieAdmin(res, token) {
  const opcoes = [`${NOME_COOKIE_ADMIN}=${encodeURIComponent(token)}`, "Path=/", "HttpOnly", "SameSite=Strict",
    `Max-Age=${Math.floor(ambiente.duracaoSessaoAdminMs / 1000)}`];
  if (ambiente.ambienteProducao) opcoes.push("Secure");
  res.setHeader("Set-Cookie", opcoes.join("; "));
}

function limparCookieAdmin(res) {
  const opcoes = [`${NOME_COOKIE_ADMIN}=`, "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"];
  if (ambiente.ambienteProducao) opcoes.push("Secure");
  res.setHeader("Set-Cookie", opcoes.join("; "));
}

function obterAdmin(req) {
  const token = lerCookie(req, NOME_COOKIE_ADMIN);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, ambiente.jwtSecret);
    if (payload.tipo !== "admin") return null;
    const usuario = usuarioModel.buscarPorId(payload.id);
    if (!usuario || usuario.ativo === false || !["admin", "superadmin"].includes(usuario.role)) return null;
    return { ...usuario, superAdmin: usuario.role === "superadmin" || usuario.superAdmin === true };
  } catch (_) { return null; }
}

function verificarAdmin(req, res, next) {
  const admin = obterAdmin(req);
  if (!admin) return res.status(401).json({ mensagem: "Acesso administrativo não autorizado. Entre novamente." });
  req.admin = admin;
  next();
}

function protegerPaginaAdmin(req, res, next) {
  const admin = obterAdmin(req);
  if (!admin) return res.redirect("/login");
  req.admin = admin;
  next();
}

function exigirSuperAdmin(req, res, next) {
  if (!req.admin || req.admin.role !== "superadmin") {
    return res.status(403).json({ mensagem: "Somente o superadministrador pode realizar esta ação." });
  }
  next();
}

module.exports = { NOME_COOKIE_ADMIN, criarCookieAdmin, limparCookieAdmin, obterAdmin, verificarAdmin, protegerPaginaAdmin, exigirSuperAdmin };
