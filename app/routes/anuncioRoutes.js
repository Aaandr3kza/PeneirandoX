const express = require("express");
const router = express.Router();
const anuncioModel = require("../models/anuncioModel");
router.get("/", (req, res) => {
  const formato = req.query.formato;
  if (formato && !["largo", "alto", "quadrado"].includes(formato)) {
    return res.status(400).json({ mensagem: "Formato inválido." });
  }
  const anuncios = anuncioModel.lerTodos().filter((item) => item.ativo !== false && (!formato || item.formato === formato));
  res.setHeader("Cache-Control", "no-store");
  return res.json(anuncios);
});
module.exports = router;
