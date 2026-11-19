/*define as páginas HTML renderizadas pelo Express e EJS*/

const express = require("express");
const router = express.Router();
const { protegerPaginaAdmin } = require("../middlewares/adminAuth");

router.get("/", (req, res) => {
  res.render("pages/index", { titulo: "PeneirandoX — Seletivas Esportivas", paginaAtiva: "home" });
});

router.get("/pesquisar", (req, res) => {
  res.render("pages/pesquisar", { titulo: "Pesquisar seletivas — PeneirandoX", paginaAtiva: "pesquisar" });
});

router.get("/favoritos", (req, res) => {
  res.render("pages/favoritos", { titulo: "Favoritos — PeneirandoX", paginaAtiva: "favoritos" });
});

router.get("/login", (req, res) => {
  res.render("pages/login", { titulo: "Entrar — PeneirandoX" });
});

router.get("/perfil", (req, res) => {
  res.render("pages/perfil", { titulo: "Perfil — PeneirandoX", paginaAtiva: "perfil" });
});

router.get("/admin/login", (req, res) => res.redirect("/login"));

router.get("/admin", protegerPaginaAdmin, (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.render("pages/admin", { titulo: "Painel administrativo — PeneirandoX", admin: req.admin, paginaAtiva: "admin" });
});

module.exports = router;
