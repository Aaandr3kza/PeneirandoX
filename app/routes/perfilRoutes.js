/*define as rotas protegidas de consulta e edição do perfil*/

const express = require("express");
const router = express.Router();
const autenticar = require("../middlewares/autenticar");
const validarRequisicao = require("../middlewares/validarRequisicao");
const perfilController = require("../controllers/perfilController");
const { validarPerfil } = require("../validators/authValidator");

router.get("/me", autenticar, perfilController.obterPerfil);
router.put("/me", autenticar, validarPerfil, validarRequisicao, perfilController.atualizarPerfil);
router.get("/me/favoritos", autenticar, perfilController.obterFavoritos);
router.put("/me/favoritos", autenticar, perfilController.atualizarFavoritos);

module.exports = router;
