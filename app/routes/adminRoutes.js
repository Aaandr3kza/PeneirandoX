/* Rotas protegidas do painel. Todas exigem sessão de admin/superadmin. */
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verificarAdmin } = require("../middlewares/adminAuth");
const validarRequisicao = require("../middlewares/validarRequisicao");
const { validarTime, validarUsuario } = require("../validators/adminValidator");

router.post("/logout", verificarAdmin, adminController.logout);
router.get("/sessao", verificarAdmin, adminController.obterSessao);
router.get("/times", verificarAdmin, adminController.listarTimes);
router.post("/times", verificarAdmin, validarTime, validarRequisicao, adminController.criarTime);
router.put("/times/:id", verificarAdmin, validarTime, validarRequisicao, adminController.atualizarTime);
router.delete("/times/:id", verificarAdmin, adminController.excluirTime);
router.get("/usuarios", verificarAdmin, adminController.listarUsuarios);
router.put("/usuarios/:id", verificarAdmin, validarUsuario, validarRequisicao, adminController.atualizarUsuario);
router.delete("/usuarios/:id", verificarAdmin, adminController.excluirUsuario);
router.get("/anuncios", verificarAdmin, adminController.listarAnuncios);
router.post("/anuncios", verificarAdmin, (req, res, next) => {
  const { titulo, formato, imagem } = req.body || {};
  if (typeof titulo !== "string" || titulo.trim().length < 2 || titulo.length > 100 ||
      !["largo", "alto", "quadrado"].includes(formato) ||
      typeof imagem !== "string" || imagem.trim().length < 4 || imagem.length > 500 ||
      !/^(https?:\/\/|\/)/i.test(imagem)) {
    return res.status(400).json({ mensagem: "Informe título, formato e imagem válida (URL http(s) ou caminho iniciado por /)." });
  }
  next();
}, adminController.criarAnuncio);
router.delete("/anuncios/:id", verificarAdmin, adminController.excluirAnuncio);
module.exports = router;
