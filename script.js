// ============ CHAVES DO SUPABASE ============
const URL_SUPABASE = "https://tjnirktxvwsdeosqqzof.supabase.co";
const CHAVE_ANON = "sb_publishable_i7kOtgYgjblLSFfe4JApAQ_s_opjTVj";
// ===============================================

const db = supabase.createClient(URL_SUPABASE, CHAVE_ANON);

// ---------- PORTFOLIO (lista de projetos com foto) ----------
async function carregarPortfolio() {
  const lista = document.getElementById("lista-portfolio");
  if (!lista) return;

  const limite = Number(lista.dataset.limite) || 100;
  lista.textContent = "Carregando projetos...";

  const { data, error } = await db
    .from("portfolio")
    .select("*")
    .order("id", { ascending: false })
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

    // Exibe a foto se existir no banco
    if (p.imagem_url) {
      const img = document.createElement("img");
      img.src = p.imagem_url;
      img.alt = "Capa do projeto " + p.titulo;
      img.style.width = "100%";
      img.style.height = "190px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "8px";
      img.style.marginBottom = "1rem";
      card.appendChild(img);
    }

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
      resposta.textContent = "Mensagem enviada com sucesso! Obrigado pelo contato.";
      form.reset();
    }
    botao.disabled = false;
  });
}

// ---------- PAINEL ADMIN (mensagens e cadastro de projetos) ----------
async function carregarLeads() {
  const corpo = document.getElementById("corpo-leads");
  const contador = document.getElementById("contador-leads");
  if (!corpo) return;

  const { data, error } = await db
    .from("leads")
    .select("*")
    .order("criado_em", { ascending: false });

  corpo.textContent = "";

  if (error) {
    console.error(error);
    corpo.innerHTML = "<tr><td colspan='5'>Erro ao carregar mensagens.</td></tr>";
    return;
  }

  if (contador) contador.textContent = data.length;

  if (data.length === 0) {
    corpo.innerHTML = "<tr><td colspan='5'>Nenhuma mensagem recebida ainda.</td></tr>";
    return;
  }

  data.forEach((l) => {
    const tr = document.createElement("tr");

    const dataFormatada = l.criado_em
      ? new Date(l.criado_em).toLocaleString("pt-BR")
      : "-";

    [dataFormatada, l.nome, l.email, l.mensagem].forEach((texto) => {
      const td = document.createElement("td");
      td.textContent = texto;
      tr.appendChild(td);
    });

    // Botão para excluir mensagem
    const tdAcao = document.createElement("td");
    const btnExcluir = document.createElement("button");
    btnExcluir.type = "button";
    btnExcluir.textContent = "Excluir";
    btnExcluir.className = "botao botao-claro";
    btnExcluir.style.padding = "0.3rem 0.6rem";
    btnExcluir.style.fontSize = "0.85rem";

    btnExcluir.addEventListener("click", async () => {
      if (!confirm("Deseja excluir esta mensagem?")) return;
      const { error: errDel } = await db.from("leads").delete().eq("id", l.id);
      if (!errDel) carregarLeads();
    });

    tdAcao.appendChild(btnExcluir);
    tr.appendChild(tdAcao);

    corpo.appendChild(tr);
  });
}

async function montarPainel(user) {
  const emailEl = document.getElementById("usuario-email");
  if (emailEl) emailEl.textContent = user.email;

  const areaAdmin = document.getElementById("area-admin");
  const aviso = document.getElementById("aviso-permissao");

  const { data, error } = await db
    .from("usuarios")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();

  const ehAdmin = !error && data && data.admin === true;
  if (areaAdmin) areaAdmin.hidden = !ehAdmin;
  if (aviso) aviso.hidden = ehAdmin;

  if (ehAdmin) carregarLeads();
}

async function iniciarUsuario() {
  const areaLogin = document.getElementById("area-login");
  const areaPainel = document.getElementById("area-painel");
  if (!areaLogin && !areaPainel) return;

  const formLogin = document.getElementById("form-login");
  const msgLogin = document.getElementById("msg-login");

  async function atualizarTela() {
    const { data } = await db.auth.getSession();
    const sessao = data.session;
    if (areaLogin) areaLogin.hidden = !!sessao;
    if (areaPainel) areaPainel.hidden = !sessao;
    if (sessao) await montarPainel(sessao.user);
  }

  if (formLogin) {
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
  }

  const botaoSair = document.getElementById("botao-sair");
  if (botaoSair) {
    botaoSair.addEventListener("click", async () => {
      await db.auth.signOut();
      atualizarTela();
    });
  }

  // Cadastrar novo projeto com upload de foto
  const formProjeto = document.getElementById("form-novo-projeto");
  const msgProjeto = document.getElementById("msg-projeto");

  if (formProjeto) {
    formProjeto.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const botaoSalvar = formProjeto.querySelector("button[type='submit']");
      botaoSalvar.disabled = true;
      msgProjeto.textContent = "Salvando projeto...";

      let imagemUrlFinal = null;
      const arquivoFoto = formProjeto.foto?.files?.[0];

      // 1. Se selecionou uma foto, envia para o Storage "projetos"
      if (arquivoFoto) {
        msgProjeto.textContent = "Enviando foto...";
        const extensao = arquivoFoto.name.split(".").pop();
        const nomeArquivo = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extensao}`;

        const { error: uploadError } = await db.storage
          .from("projetos")
          .upload(nomeArquivo, arquivoFoto);

        if (uploadError) {
          console.error(uploadError);
          msgProjeto.textContent = "Erro ao enviar foto: " + uploadError.message;
          botaoSalvar.disabled = false;
          return;
        }

        const { data: urlData } = db.storage
          .from("projetos")
          .getPublicUrl(nomeArquivo);

        imagemUrlFinal = urlData.publicUrl;
      }

      // 2. Grava os dados do projeto no banco
      const { error } = await db.from("portfolio").insert({
        titulo: formProjeto.titulo.value.trim(),
        descricao: formProjeto.descricao.value.trim() || null,
        tecnologias: formProjeto.tecnologias.value.trim() || null,
        link: formProjeto.link.value.trim() || null,
        imagem_url: imagemUrlFinal,
      });

      if (error) {
        console.error(error);
        msgProjeto.textContent = "Erro ao salvar: " + error.message;
      } else {
        msgProjeto.textContent = "Projeto adicionado com sucesso!";
        formProjeto.reset();
      }

      botaoSalvar.disabled = false;
    });
  }

  atualizarTela();
}

carregarPortfolio();
configurarContato();
iniciarUsuario();
