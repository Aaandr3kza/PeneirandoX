/*le e grava os times e seletivas no arquivo times.json*/

const fs = require("fs");
const path = require("path");
const ambiente = require("../../config/environment");

function lerTodos() {
  try {
    const conteudo = fs.readFileSync(ambiente.caminhoTimes, "utf8");
    const times = JSON.parse(conteudo || "[]");
    return Array.isArray(times) ? times : [];
  } catch (erro) {
    if (erro.code === "ENOENT") return [];
    throw erro;
  }
}

function salvarTodos(times) {
  fs.mkdirSync(path.dirname(ambiente.caminhoTimes), { recursive: true });
  const temporario = ambiente.caminhoTimes + ".tmp";
  fs.writeFileSync(temporario, JSON.stringify(times, null, 2) + "\n", "utf8");
  fs.renameSync(temporario, ambiente.caminhoTimes);
}

function buscarPorId(id) {
  return lerTodos().find((time) => time.id === id) || null;
}

function adicionar(time) {
  const times = lerTodos();
  times.push(time);
  salvarTodos(times);
  return time;
}

function atualizar(id, dados) {
  const times = lerTodos();
  const indice = times.findIndex((time) => time.id === id);
  if (indice === -1) return null;
  times[indice] = { ...times[indice], ...dados, id };
  salvarTodos(times);
  return times[indice];
}

function remover(id) {
  const times = lerTodos();
  const filtrados = times.filter((time) => time.id !== id);
  if (filtrados.length === times.length) return false;
  salvarTodos(filtrados);
  return true;
}

module.exports = { lerTodos, salvarTodos, buscarPorId, adicionar, atualizar, remover };
