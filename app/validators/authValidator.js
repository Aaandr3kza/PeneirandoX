/*define regras de validação para cadastro e login de usuários*/

const { body } = require("express-validator");

const ESTADOS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const GENEROS = ["Masculino", "Feminino", "Outro"];

const validarCadastro = [
  body("email").trim().isEmail().withMessage("Informe um e-mail válido.").normalizeEmail(),
  body("senha").isString().isLength({ min: 8, max: 72 }).withMessage("A senha deve ter entre 8 e 72 caracteres."),
  body("gender").isIn(GENEROS).withMessage("Selecione um gênero válido."),
  body("city").trim().isLength({ min: 2, max: 80 }).withMessage("Informe uma cidade válida."),
  body("state").isIn(ESTADOS).withMessage("Selecione um estado válido."),
  body("age").isInt({ min: 8, max: 99 }).withMessage("A idade deve ser um número inteiro entre 8 e 99."),
  body("sports").optional().isArray().withMessage("A lista de esportes está inválida."),
  body("sports.*").optional().isString().withMessage("Cada esporte deve ser um texto.")
];

const validarLogin = [
  body("email").trim().isEmail().withMessage("Informe um e-mail válido.").normalizeEmail(),
  body("senha").isString().notEmpty().withMessage("Informe sua senha.")
];

const validarPerfil = [
  body("gender").isIn(GENEROS).withMessage("Selecione um gênero válido."),
  body("city").trim().isLength({ min: 2, max: 80 }).withMessage("Informe uma cidade válida."),
  body("state").isIn(ESTADOS).withMessage("Selecione um estado válido."),
  body("age").isInt({ min: 8, max: 99 }).withMessage("A idade deve ser um número inteiro entre 8 e 99."),
  body("sports").isArray().withMessage("A lista de esportes está inválida."),
  body("sports.*").optional().isString().withMessage("Cada esporte deve ser um texto.")
];

module.exports = { validarCadastro, validarLogin, validarPerfil };
