/*define as rotas públicas de consulta das seletivas*/

const express = require("express");
const router = express.Router();
const timeModel = require("../models/timeModel");

// A API pública só retorna as seletivas ativas. O arquivo JSON permanece fora de /public.
router.get("/", (req, res, next) => {
  try {
    return res.json(timeModel.lerTodos().filter((time) => time.active !== false));
  } catch (erro) {
    return next(erro);
  }
});

module.exports = router;
