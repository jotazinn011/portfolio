// ============ CHAVES DO SUPABASE ============
const URL_SUPABASE = "https://tjnirktxvwsdeosqqzof.supabase.co";
const CHAVE_ANON = "sb_publishable_i7kOtgYgjblLSFfe4JApAQ_s_opjTVj";
// ============================================

const dbAuth = supabase.createClient(URL_SUPABASE, CHAVE_ANON);

// ---------- CARREGAR LEADS NO DASHBOARD ----------
async function carregarLeads() {
  const corpo = document.getElementById("corpo-leads");
  if (!corpo) return;

  const { data, error } = await dbAuth
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

// ---------- VERIFICAR PERMISSÃO DE ADMIN ----------
async function montarPainel(user) {
  document.getElementById("usuario-email").textContent = user.email;

  const areaAdmin = document.getElementById("area-admin");
  const aviso = document.getElementById("aviso-permissao");

  const { data, error } = await dbAuth
    .from("usuarios")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();

  const ehAdmin = !error && data && data.admin === true;
  areaAdmin.hidden = !ehAdmin;
  aviso.hidden = ehAdmin;

  if (ehAdmin) carregarLeads();
}

// ---------- LÓGICA DA PÁGINA DE LOGIN (usuario.html) ----------
async function configurarLogin() {
  const areaLogin = document.getElementById("area-login");
  if (!areaLogin) return;

  // Se já estiver logado, vai direto para o dashboard
  const { data } = await dbAuth.auth.getSession();
  if (data.session) {
    window.location.href = "dashboard.html";
    return;
  }

  // Mostra o formulário de login (caso estivesse oculto)
  areaLogin.hidden = false;

  const formLogin = document.getElementById("form-login");
  const msgLogin = document.getElementById("msg-login");

  formLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    msgLogin.textContent = "Entrando...";

    const { error } = await dbAuth.auth.signInWithPassword({
      email: formLogin.email.value.trim(),
      password: formLogin.senha.value,
    });

    if (error) {
      msgLogin.textContent = "Não foi possível entrar: " + error.message;
      return;
    }

    // Login deu certo: redireciona para o dashboard
    window.location.href = "dashboard.html";
  });
}

// ---------- LÓGICA DA PÁGINA DO PAINEL (dashboard.html) ----------
async function configurarDashboard() {
  const areaPainel = document.getElementById("area-painel");
  if (!areaPainel) return;

  // Proteção: se não estiver logado, expulsa de volta para o login
  const { data } = await dbAuth.auth.getSession();
  if (!data.session) {
    window.location.href = "usuario.html";
    return;
  }

  // Mostra o painel e carrega os dados
  areaPainel.hidden = false;
  await montarPainel(data.session.user);

  // Botão Sair
  document.getElementById("botao-sair").addEventListener("click", async () => {
    await dbAuth.auth.signOut();
    window.location.href = "usuario.html";
  });

  // Cadastrar novo projeto
  const formProjeto = document.getElementById("form-novo-projeto");
  const msgProjeto = document.getElementById("msg-projeto");

  formProjeto.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    msgProjeto.textContent = "Salvando...";

    const { error } = await dbAuth.from("portfolio").insert({
      titulo: formProjeto.titulo.value.trim(),
      descricao: formProjeto.descricao.value.trim() || null,
      tecnologias: formProjeto.tecnologias.value.trim() || null,
      link: formProjeto.link.value.trim() || null,
    });

    if (error) {
      console.error(error);
      msgProjeto.textContent = "Erro ao salvar: " + error.message;
    } else {
      msgProjeto.textContent = "Projeto adicionado com sucesso!";
      formProjeto.reset();
    }
  });
}

configurarLogin();
configurarDashboard();