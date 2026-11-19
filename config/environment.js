/*centraliza configurações do ambiente, caminhos dos arquivos JSON e chave JWT*/

const path = require("path");

// Centralize aqui os caminhos e valores usados em diferentes arquivos.
const ambiente = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  ambienteProducao: process.env.NODE_ENV === "production",
  caminhoUsuarios: path.join(__dirname, "../app/data/usuarios.json"),
  caminhoTimes: path.join(__dirname, "../app/data/times.json"),
  caminhoAnuncios: path.join(__dirname, "../app/data/anuncios.json"),
  duracaoSessaoAdminMs: 4 * 60 * 60 * 1000
};

// A chave JWT precisa existir para que as sessões administrativas sejam assinadas.
if (!ambiente.jwtSecret || ambiente.jwtSecret.length < 32) {
  throw new Error("JWT_SECRET não foi configurado ou tem menos de 32 caracteres. Ajuste o arquivo .env.");
}

module.exports = ambiente;
