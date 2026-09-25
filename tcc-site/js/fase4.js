document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector) => document.querySelector(selector);
  const frases = [
    "Zero: O sistema corrompeu a estrutura da saída. Ajude-me a remontar o HTML e abrir o acesso à fase 5.",
    "A página perdeu suas tags. Vamos reconstruí-las na ordem correta: html, head, title, body e o conteúdo.",
    "Caminhe pelo cenário com W, A, S e D. Encontre a tag indicada e aperte F. Cada escolha certa repara uma parte; uma escolha fora de ordem custa uma chance."
  ];
  const ordem = ["html", "head", "title", "body", "h1", "p"];
  const posicoes = [
    [18, 32], [43, 25], [68, 34], [82, 68], [55, 78], [29, 66]
  ];
  const falas = [
    { tag: "html", dica: "A raiz contém toda a página." },
    { tag: "head", dica: "As informações da página ficam no head." },
    { tag: "title", dica: "O title define o texto da aba do navegador." },
    { tag: "body", dica: "O conteúdo visível fica dentro do body." },
    { tag: "h1", dica: "O h1 é o título principal da página." },
    { tag: "p", dica: "A tag p representa um parágrafo." }
  ];
  let dialogo = 0, etapa = 0, vidas = 3, x = 9, y = 75, bloqueado = false;
  const teclas = new Set(), codigo = $("#codigo"), jogador = $("#personagem");
  const itens = new Map();

  $("#fala").textContent = frases[0];
  $("#continuar").addEventListener("click", () => {
    dialogo++;
    if (dialogo < frases.length) { $("#fala").textContent = frases[dialogo]; return; }
    $("#intro").classList.add("oculto"); $("#jogo").classList.remove("oculto"); atualizar(); requestAnimationFrame(loop);
  });

  ordem.forEach((tag, index) => {
    const item = document.createElement("button");
    item.type = "button"; item.className = "tag-item"; item.dataset.tag = tag;
    item.style.left = posicoes[index][0] + "%"; item.style.top = posicoes[index][1] + "%";
    item.innerHTML = `<span class="tag-icone">&lt;/&gt;</span><b>&lt;${tag}&gt;</b>`;
    item.setAttribute("aria-label", `Tag ${tag}`);
    $("#arena").append(item); itens.set(tag, item);
  });

  function adicionarLinha(tag) {
    const linha = document.createElement("span"); linha.className = "linha";
    const recuo = tag === "html" ? "" : tag === "head" || tag === "body" ? "  " : "    ";
    linha.textContent = recuo + `<${tag}>`;
    codigo.insertBefore(linha, codigo.querySelector(".cursor"));
    if (tag === "title") {
      adicionarTexto("      </title>"); adicionarTexto("  </head>");
    }
    if (tag === "h1") adicionarTexto("    </h1>");
    if (tag === "p") {
      adicionarTexto("    </p>"); adicionarTexto("  </body>"); adicionarTexto("</html>");
    }
  }
  function adicionarTexto(texto) { const linha = document.createElement("span"); linha.className = "linha fechamento"; linha.textContent = texto; codigo.insertBefore(linha, codigo.querySelector(".cursor")); }
  function atualizar() {
    jogador.style.left = x + "%"; jogador.style.top = y + "%";
    const esperado = falas[etapa];
    $("#objetivo").textContent = `<${esperado.tag}>`;
    $("#dica").textContent = esperado.dica;
    $("#contador").textContent = `${etapa} / ${ordem.length}`;
    $("#vidas").innerHTML = Array.from({length: 3}, (_, i) => `<b class="${i >= vidas ? "perdida" : ""}">♥</b>`).join("");
    itens.forEach((item, tag) => {
      item.disabled = tag !== esperado.tag;
      item.classList.toggle("atual", tag === esperado.tag);
      item.classList.toggle("coletada", ordem.indexOf(tag) < etapa);
    });
    $("#aviso").textContent = `ENCONTRE &lt;${esperado.tag}&gt; · USE W A S D E APERTE F`;
  }
  function loop() {
    if (!bloqueado && !$("#jogo").classList.contains("oculto")) {
      if (teclas.has("a")) x -= .27; if (teclas.has("d")) x += .27;
      if (teclas.has("w")) y -= .27; if (teclas.has("s")) y += .27;
      x = Math.max(4, Math.min(96, x)); y = Math.max(12, Math.min(91, y));
      jogador.style.left = x + "%"; jogador.style.top = y + "%";
      const esperado = falas[etapa];
      const perto = esperado && Math.hypot((x - posicoes[etapa][0]) * .72, y - posicoes[etapa][1]) < 7;
      if (perto) $("#aviso").textContent = `APERTE F PARA COLETAR &lt;${esperado.tag}&gt;`;
      atualizarStatusPerto(perto);
    }
    requestAnimationFrame(loop);
  }
  let podeColetar = false;
  function atualizarStatusPerto(valor) { podeColetar = Boolean(valor); }
  function coletar() {
    const esperado = falas[etapa]; if (!esperado) return;
    const itemProximo = [...itens.entries()].find(([tag, element]) => {
      if (element.classList.contains("coletada")) return false;
      const index = ordem.indexOf(tag);
      return Math.hypot((x - posicoes[index][0]) * .72, y - posicoes[index][1]) < 7;
    });
    if (!itemProximo) { $("#mensagem").textContent = "Chegue perto de uma tag para coletá-la."; return; }
    const [tag, item] = itemProximo;
    if (tag !== esperado.tag) { errar(tag, esperado.tag); return; }
    item.classList.add("coletada"); etapa++; adicionarLinha(tag);
    $("#mensagem").textContent = etapa === ordem.length ? "Estrutura completa!" : `&lt;${tag}&gt; adicionada. Procure a próxima tag.`;
    if (etapa === ordem.length) { bloquearCompletude(); return; }
    atualizar();
  }
  function errar(escolhida, esperada) {
    vidas--; bloqueado = true;
    $("#textoErro").textContent = `Você encontrou <${escolhida}>, mas agora o painel precisa de <${esperada}>. Observe a dica e tente novamente.`;
    $("#tentarNovamente").textContent = vidas ? "VOLTAR AO MAPA" : "RECOMEÇAR";
    $("#erroTela").classList.add("mostrar"); atualizar();
    $("#tentarNovamente").onclick = () => {
      $("#erroTela").classList.remove("mostrar"); bloqueado = false;
      if (!vidas) reiniciar();
    };
  }
  function bloquearCompletude() {
    bloqueado = true; $("#contador").textContent = `${ordem.length} / ${ordem.length}`;
    $("#codigoFinal").textContent = codigo.innerText.replace("_", "");
    setTimeout(() => $("#vitoriaTela").classList.add("mostrar"), 500);
  }
  function reiniciar() {
    etapa = 0; vidas = 3; x = 9; y = 75; bloqueado = false;
    codigo.innerHTML = '<span class="cursor">_</span>';
    itens.forEach(item => item.classList.remove("coletada")); $("#mensagem").textContent = "Encontre a tag indicada no mapa."; atualizar();
  }
  document.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();
    if (["w", "a", "s", "d", "f"].includes(key)) event.preventDefault();
    if (["w", "a", "s", "d"].includes(key) && !bloqueado) teclas.add(key);
    if (key === "f" && !event.repeat && !bloqueado) coletar();
  });
  document.addEventListener("keyup", event => teclas.delete(event.key.toLowerCase()));
  $("#proximaFase").addEventListener("click", async () => {
    if (window.SaveSystem) await SaveSystem.atualizarFase(5);
    window.location.href = "fase5.html";
  });
  if (window.SaveSystem) SaveSystem.atualizarFase(4);
});
