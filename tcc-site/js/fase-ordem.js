document.addEventListener("DOMContentLoaded", () => {
  if (location.pathname.endsWith("fase3.html")) {
    document.title = "Fase 2 - Monte a Estrutura";
    const etapa = document.querySelector("#sala .hud span:nth-child(2)");
    const fase = document.querySelector("#desafio .topo-jogo span");
    if (etapa) etapa.textContent = "FASE 02 / PAINEL DE ESTRUTURA";
    if (fase) fase.textContent = "FASE 02";
  }
  if (location.pathname.endsWith("fase2-arena.html")) {
    document.title = "Fase 3 - Conexões HTML";
    const etapa = document.querySelector(".hud span:nth-child(2)");
    const porta = document.querySelector("#porta small");
    const avancar = document.querySelector("#nextButton");
    if (etapa) etapa.textContent = "FASE 03 / CONEXÕES HTML";
    if (porta) porta.textContent = "PORTA 03";
    if (avancar) setTimeout(() => {
      const botao = document.querySelector("#nextButton");
      if (!botao) return;
      botao.textContent = "IR PARA FASE 4";
      botao.onclick = async () => {
        if (window.SaveSystem) await SaveSystem.updateActivePhase(4);
        else localStorage.setItem("faseAtual", "4");
        location.href = "lobby.html";
      };
    }, 0);
  }
});
