/*le e grava as contas comuns no arquivo usuarios.json*/

const fs = require("fs");
const path = require("path");
const ambiente = require("../../config/environment");
const bcrypt = require("bcryptjs");

function lerTodos() {
  try {
    const conteudo = fs.readFileSync(ambiente.caminhoUsuarios, "utf8");
    const usuarios = JSON.parse(conteudo || "[]");
    return Array.isArray(usuarios) ? usuarios : [];
  } catch (erro) {
    if (erro.code === "ENOENT") return [];
    throw erro;
  }
}

function salvarTodos(usuarios) {
  fs.mkdirSync(path.dirname(ambiente.caminhoUsuarios), { recursive: true });
  const temporario = ambiente.caminhoUsuarios + ".tmp";
  fs.writeFileSync(temporario, JSON.stringify(usuarios, null, 2) + "\n", "utf8");
  fs.renameSync(temporario, ambiente.caminhoUsuarios);
}

function buscarPorEmail(email) {
  return lerTodos().find((usuario) => usuario.email === email) || null;
}

function buscarPorId(id) {
  return lerTodos().find((usuario) => usuario.id === id) || null;
}

function adicionar(usuario) {
  const usuarios = lerTodos();
  usuarios.push(usuario);
  salvarTodos(usuarios);
  return usuario;
}

function atualizar(id, dados) {
  const usuarios = lerTodos();
  const indice = usuarios.findIndex((usuario) => usuario.id === id);
  if (indice === -1) return null;
  usuarios[indice] = { ...usuarios[indice], ...dados };
  salvarTodos(usuarios);
  return usuarios[indice];
}

function paraPublico(usuario) {
  if (!usuario) return null;
  const { senhaHash, _senhaDemoAtualizada, ...dadosPublicos } = usuario;
  return dadosPublicos;
}


// Cria a conta administrativa demonstrativa uma única vez na inicialização.
// O cadastro público nunca recebe nem aceita o campo role.
function garantirAdminInicial() {
  const usuarios = lerTodos();
  const email = "adm@gmail.com";

  // A demonstração terá somente uma conta administrativa: a conta reservada abaixo.
  usuarios.forEach((usuario) => {
    if (usuario.email !== email && ["admin", "superadmin"].includes(usuario.role)) {
      usuario.role = "user";
      usuario.superAdmin = false;
    }
  });

  const existente = usuarios.find((usuario) => usuario.email === email);

  if (existente) {
    // Se a conta ainda não era superadmin, converte-a para a credencial reservada da demonstração.
    const jaEraSuperAdmin = existente.role === "superadmin";
    existente.role = "superadmin";
    existente.superAdmin = true;
    existente.ativo = true;
    if (!jaEraSuperAdmin || !existente.senhaHash) existente.senhaHash = bcrypt.hashSync("123ADM", 12);
    salvarTodos(usuarios);
    return;
  }

  usuarios.push({
    id: "admin-peneirandox-principal",
    email,
    senhaHash: bcrypt.hashSync("123ADM", 12),
    role: "superadmin",
    superAdmin: true,
    ativo: true,
    gender: "Outro",
    city: "Barueri",
    state: "SP",
    age: 18,
    sports: [],
    favoritos: []
  });
  salvarTodos(usuarios);
}

module.exports = { lerTodos, salvarTodos, buscarPorEmail, buscarPorId, adicionar, atualizar, paraPublico, garantirAdminInicial };

