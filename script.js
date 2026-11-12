// ============ COLE SUAS CHAVES AQUI ============
// Supabase > Project Settings > API
const URL_SUPABASE = "https://tjnirktxvwsdeosqqzof.supabase.co/rest/v1/";   // ex.: https://abcdefgh.supabase.co
const CHAVE_ANON = "sb_publishable_i7kOtgYgjblLSFfe4JApAQ_s_opjTVj";      // chave "anon public" (NUNCA a service_role)
// ===============================================

const db = supabase.createClient(URL_SUPABASE, CHAVE_ANON);

// ---------- PORTFOLIO (lista de projetos) ----------
async function carregarPortfolio() {
  const lista = document.getElementById("lista-portfolio");
  if (!lista) return;

  const limite = Number(lista.dataset.limite) || 100;
  lista.textContent = "Carregando projetos...";

  const { data, error } = await db
    .from("portfolio")
    .select("*")
    .order("id", { ascending: true })
    .limit(limite);

  if (error) {
    lista.textContent = "Erro: " + error.message;
    console.error(error);
    return;
  }

  if (data.length === 0) {
    lista.textContent = "Nenhum projeto cadastrado ainda.";
    return;
  }

  lista.textContent = "";

  data.forEach((p) => {
    const card = document.createElement("article");
    card.className = "card";

    const titulo = document.createElement("h3");
    titulo.textContent = p.titulo;
    card.appendChild(titulo);

    if (p.descricao) {
      const desc = document.createElement("p");
      desc.textContent = p.descricao;
      card.appendChild(desc);
    }

    if (p.tecnologias) {
      const tec = document.createElement("p");
      tec.className = "tecnologias";
      tec.textContent = p.tecnologias;
      card.appendChild(tec);
    }

    if (p.link && p.link.startsWith("http")) {
      const a = document.createElement("a");
      a.href = p.link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Ver projeto";
      card.appendChild(a);
    }

    lista.appendChild(card);
  });
}

// ---------- CONTATO (grava na tabela leads) ----------
function configurarContato() {
  const form = document.getElementById("form-contato");
  if (!form) return;

  const resposta = document.getElementById("resposta-form");
  const botao = form.querySelector("button");

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    botao.disabled = true;
    resposta.textContent = "Enviando...";

    const { error } = await db.from("leads").insert({
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      mensagem: form.mensagem.value.trim(),
    });

    if (error) {
      console.error(error);
      resposta.textContent = "Erro ao enviar: " + error.message;
    } else {
      resposta.textContent = "Mensagem enviada. Obrigado!";
      form.reset();
    }
    botao.disabled = false;
  });
}

// ---------- USUARIO (login com cadeado) ----------
async function carregarLeads() {
  const corpo = document.getElementById("corpo-leads");
  if (!corpo) return;

  const { data, error } = await db
    .from("leads")
    .select("*")
    .order("criado_em", { ascending: false });

  corpo.textContent = "";

  if (error) {
    console.error(error);
    corpo.innerHTML = "<tr><td colspan='4'>Erro ao carregar leads.</td></tr>";
    return;
  }

  if (data.length === 0) {
    corpo.innerHTML = "<tr><td colspan='4'>Nenhum lead ainda.</td></tr>";
    return;
  }

  data.forEach((l) => {
    const tr = document.createElement("tr");
    [
      new Date(l.criado_em).toLocaleString("pt-BR"),
      l.nome,
      l.email,
      l.mensagem,
    ].forEach((texto) => {
      const td = document.createElement("td");
      td.textContent = texto;
      tr.appendChild(td);
    });
    corpo.appendChild(tr);
  });
}

async function montarPainel(user) {
  document.getElementById("usuario-email").textContent = user.email;

  const areaAdmin = document.getElementById("area-admin");
  const aviso = document.getElementById("aviso-permissao");

  const { data, error } = await db
    .from("usuarios")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();

  const ehAdmin = !error && data && data.admin === true;
  areaAdmin.hidden = !ehAdmin;
  aviso.hidden = ehAdmin;

  if (ehAdmin) carregarLeads();
}

async function iniciarUsuario() {
  const areaLogin = document.getElementById("area-login");
  if (!areaLogin) return;

  const areaPainel = document.getElementById("area-painel");
  const formLogin = document.getElementById("form-login");
  const msgLogin = document.getElementById("msg-login");

  async function atualizarTela() {
    const { data } = await db.auth.getSession();
    const sessao = data.session;
    areaLogin.hidden = !!sessao;
    areaPainel.hidden = !sessao;
    if (sessao) await montarPainel(sessao.user);
  }

  formLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    msgLogin.textContent = "Entrando...";

    const { error } = await db.auth.signInWithPassword({
      email: formLogin.email.value.trim(),
      password: formLogin.senha.value,
    });

    if (error) {
      msgLogin.textContent = "Não foi possível entrar: " + error.message;
      return;
    }

    msgLogin.textContent = "";
    formLogin.reset();
    atualizarTela();
  });

  document.getElementById("botao-sair").addEventListener("click", async () => {
    await db.auth.signOut();
    atualizarTela();
  });

  // Cadastrar novo projeto na tabela portfolio
  const formProjeto = document.getElementById("form-novo-projeto");
  const msgProjeto = document.getElementById("msg-projeto");

  formProjeto.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    msgProjeto.textContent = "Salvando...";

    const { error } = await db.from("portfolio").insert({
      titulo: formProjeto.titulo.value.trim(),
      descricao: formProjeto.descricao.value.trim() || null,
      tecnologias: formProjeto.tecnologias.value.trim() || null,
      link: formProjeto.link.value.trim() || null,
    });

    if (error) {
      console.error(error);
      msgProjeto.textContent = "Erro ao salvar: " + error.message;
    } else {
      msgProjeto.textContent = "Projeto adicionado. Veja na página Portfólio.";
      formProjeto.reset();
    }
  });

  atualizarTela();
}

carregarPortfolio();
configurarContato();
iniciarUsuario();