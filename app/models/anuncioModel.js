const fs = require("fs");
const path = require("path");
const ambiente = require("../../config/environment");
function lerTodos() {
  try {
    const dados = JSON.parse(fs.readFileSync(ambiente.caminhoAnuncios, "utf8") || "[]");
    return Array.isArray(dados) ? dados : [];
  } catch (erro) { if (erro.code === "ENOENT") return []; throw erro; }
}
function salvarTodos(lista) {
  fs.mkdirSync(path.dirname(ambiente.caminhoAnuncios), { recursive: true });
  const temporario = ambiente.caminhoAnuncios + ".tmp";
  fs.writeFileSync(temporario, JSON.stringify(lista, null, 2) + "\n", "utf8");
  fs.renameSync(temporario, ambiente.caminhoAnuncios);
}
function adicionar(anuncio) { const lista = lerTodos(); lista.push(anuncio); salvarTodos(lista); return anuncio; }
function remover(id) {
  const lista = lerTodos(); const nova = lista.filter((item) => item.id !== id);
  if (nova.length === lista.length) return false;
  salvarTodos(nova); return true;
}
module.exports = { lerTodos, salvarTodos, adicionar, remover };
