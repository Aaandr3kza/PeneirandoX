/*define as rotas de cadastro, login e logout de usuários comuns*/

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validarRequisicao = require("../middlewares/validarRequisicao");
const { validarCadastro, validarLogin } = require("../validators/authValidator");

router.post("/cadastro", validarCadastro, validarRequisicao, authController.cadastrar);
router.post("/login", validarLogin, validarRequisicao, authController.login);

module.exports = router;
