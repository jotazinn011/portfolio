(function () {
  var raiz = document.documentElement;
  raiz.classList.add("js");

  var tema = null;
  try { tema = localStorage.getItem("tema"); } catch (e) {}
  if (tema !== "claro" && tema !== "escuro") {
    tema = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
  }
  raiz.setAttribute("data-tema", tema);

  document.addEventListener("DOMContentLoaded", function () {
    var botaoTema = document.getElementById("botao-tema");
    if (botaoTema) {
      botaoTema.addEventListener("click", function () {
        var novo = raiz.getAttribute("data-tema") === "escuro" ? "claro" : "escuro";
        raiz.setAttribute("data-tema", novo);
        try { localStorage.setItem("tema", novo); } catch (e) {}
      });
    }

    var botaoMenu = document.getElementById("menu-botao");
    var menu = document.getElementById("menu");
    if (botaoMenu && menu) {
      botaoMenu.addEventListener("click", function () {
        var aberto = menu.classList.toggle("aberto");
        botaoMenu.setAttribute("aria-expanded", aberto ? "true" : "false");
      });
      menu.addEventListener("click", function (e) {
        if (e.target.tagName === "A") {
          menu.classList.remove("aberto");
          botaoMenu.setAttribute("aria-expanded", "false");
        }
      });
    }

    var ano = document.getElementById("ano");
    if (ano) ano.textContent = new Date().getFullYear();
  });
})();
