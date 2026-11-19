/*define regras de validação para o login e ações administrativas*/

const { body, param } = require("express-validator");

const ESTADOS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const ESPORTES = ["Futebol", "Futsal", "Basquete", "Vôlei", "Handebol", "Tênis", "Natação", "Atletismo", "Outro"];

const validarTime = [
  body("team_name").trim().isLength({ min: 2, max: 100 }).withMessage("Informe o nome do time (2 a 100 caracteres)."),
  body("sport").isIn(ESPORTES).withMessage("Selecione uma modalidade válida."),
  body("city").trim().isLength({ min: 2, max: 80 }).withMessage("Informe uma cidade válida."),
  body("state").isIn(ESTADOS).withMessage("Selecione um estado válido."),
  body("age_category").trim().isLength({ min: 2, max: 30 }).withMessage("Informe a categoria."),
  body("dates").trim().isLength({ min: 2, max: 120 }).withMessage("Informe as datas da seletiva."),
  body("short_location").trim().isLength({ min: 2, max: 100 }).withMessage("Informe o local da seletiva."),
  body("address").trim().isLength({ min: 5, max: 240 }).withMessage("Informe o endereço completo."),
  body("content_text").trim().isLength({ min: 5, max: 5000 }).withMessage("A descrição deve ter pelo menos 5 caracteres."),
  body("emblem_url").optional({ values: "falsy" }).isLength({ max: 300 }).withMessage("O caminho do escudo é muito longo."),
  body("content_images").isArray({ max: 10 }).withMessage("Informe uma lista de até 10 imagens."),
  body("content_images.*").optional().isString().isLength({ max: 300 }),
  body("registration_links").isArray({ max: 10 }).withMessage("Informe uma lista de até 10 links."),
  body("registration_links.*.label").optional().isString().isLength({ min: 1, max: 60 }),
  body("registration_links.*.url").optional().isString().isLength({ min: 1, max: 500 }),
  body("featured").isBoolean().withMessage("O campo destaque deve ser verdadeiro ou falso."),
  body("active").isBoolean().withMessage("O campo ativo deve ser verdadeiro ou falso."),
  body("lat").optional({ values: "falsy" }).isFloat({ min: -90, max: 90 }).withMessage("Latitude inválida."),
  body("lng").optional({ values: "falsy" }).isFloat({ min: -180, max: 180 }).withMessage("Longitude inválida."),
  body("registration_links").custom((links) => {
    if (!Array.isArray(links)) return false;
    return links.every((item) => item && typeof item.label === "string" && typeof item.url === "string" && /^(https?:\/\/|\/)/i.test(item.url));
  }).withMessage("Cada link precisa de um rótulo e uma URL http(s) ou caminho local iniciado por /."),
  body("content_images").custom((images) => Array.isArray(images) && images.every((item) => typeof item === "string" && /^(https?:\/\/|\/)/i.test(item))).withMessage("As imagens devem usar URL http(s) ou caminho local iniciado por /.")
];

const validarUsuario = [
  param("id").isString().notEmpty(),
  body("email").trim().isEmail().withMessage("Informe um e-mail válido.").normalizeEmail(),
  body("gender").isIn(["Masculino", "Feminino", "Outro"]).withMessage("Selecione um gênero válido."),
  body("city").trim().isLength({ min: 2, max: 80 }).withMessage("Informe uma cidade válida."),
  body("state").isIn(ESTADOS).withMessage("Selecione um estado válido."),
  body("age").isInt({ min: 8, max: 99 }).withMessage("A idade deve ser entre 8 e 99."),
  body("sports").isArray({ max: 10 }).withMessage("A lista de esportes está inválida."),
  body("sports.*").optional().isString().isLength({ max: 40 }),
  body("ativo").isBoolean().withMessage("O status deve ser verdadeiro ou falso.")
];

module.exports = { validarTime, validarUsuario };
