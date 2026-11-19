/*executa as validações do Express Validator e devolve erros padronizados*/

const { validationResult } = require("express-validator");

function validarRequisicao(req, res, next) {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(400).json({
      mensagem: "Confira os campos informados.",
      erros: erros.array()
    });
  }
  return next();
}

module.exports = validarRequisicao;
