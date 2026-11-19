/**
 * PENEIRANDOX — Inicializa o Express, configura middlewares, registra as rotas e inicia o servidor.
 */

// Carrega as variáveis do arquivo .env antes de importar as configurações.
require("dotenv").config();

const express = require("express");
const path = require("path");
const ambiente = require("./config/environment");

// Cria a aplicação principal do Express.
const app = express();

// Oculta a identificação da tecnologia usada pelo servidor.
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
app.use("/api/admin", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
// Configura o EJS para gerar as páginas HTML a partir dos arquivos .ejs.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "app/views"));

// Disponibiliza CSS, JavaScript e imagens da pasta public.
app.use(express.static(path.join(__dirname, "public"), { maxAge: ambiente.ambienteProducao ? "1d" : 0 }));
// Lê dados enviados pela API em JSON e por formulários HTML.
app.use(express.json({ limit: "150kb" }));
app.use(express.urlencoded({ extended: true, limit: "150kb" }));

// Cria/garante a conta administrativa demonstrativa no JSON unificado.
require("./app/models/usuarioModel").garantirAdminInicial();

// Disponibiliza a identidade administrativa para os menus renderizados pelo EJS.
app.use((req, res, next) => {
  res.locals.admin = require("./app/middlewares/adminAuth").obterAdmin(req);
  next();
});

// Registra as rotas de páginas e de cada parte da API.
app.use("/", require("./app/routes/router"));
app.use("/api", require("./app/routes/authRoutes"));
app.use("/api/anuncios", require("./app/routes/anuncioRoutes"));
app.use("/api", require("./app/routes/perfilRoutes"));
app.use("/api/times", require("./app/routes/timeRoutes"));
app.use("/api/admin", require("./app/routes/adminRoutes"));

// Responde com uma página 404 quando nenhuma rota corresponde ao endereço.
app.use((req, res) => {
  res.status(404).render("pages/erro", { codigo: 404, mensagem: "A página que você procura não existe." });
});

// Centraliza erros não tratados para não expor detalhes internos ao visitante.
app.use((erro, req, res, next) => {
  console.error(erro);
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
  return res.status(500).render("pages/erro", {
    codigo: 500,
    mensagem: "Ocorreu um erro interno. Tente novamente mais tarde."
  });
});

// Só inicia o servidor quando este arquivo é executado diretamente.
if (require.main === module) {
  app.listen(ambiente.port, () => {
    console.log(`PeneirandoX disponível em http://localhost:${ambiente.port}`);
  });
}

module.exports = app;
