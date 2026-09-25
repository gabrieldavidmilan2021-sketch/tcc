document.addEventListener("DOMContentLoaded", async () => {
  const corredor = document.getElementById("corredor");
  const zero = document.getElementById("zero");
  const aviso = document.getElementById("aviso");
  const status = document.getElementById("status");
  const fases = Array.from({ length: 10 }, (_, index) => index + 1);
  const destinos = fases.map(fase => fase === 2 ? "fase3.html" : fase === 3 ? "fase2-arena.html" : fase === 10 ? "final.html" : "fase" + fase + ".html");
  const liberadaAte = Math.max(1, Math.min(10, await SaveSystem.getActivePhase()));
  const teclas = new Set();
  const teclaPorSeta = { ArrowUp: "w", ArrowLeft: "a", ArrowDown: "s", ArrowRight: "d" };
  let x = window.innerWidth / 2;
  let y = window.innerHeight - 105;
  let entrando = false;
  let portaProxima = null;

  status.textContent = "PORTAS LIBERADAS: 1 — " + liberadaAte;
  fases.forEach((fase, index) => {
    const porta = document.createElement("button");
    const liberada = fase === liberadaAte;
    porta.className = "porta " + (liberada ? "liberada" : "bloqueada");
    porta.innerHTML = liberada ? String(fase).padStart(2, "0") : "<span>🔒</span>";
    porta.dataset.fase = fase;
    porta.disabled = !liberada;
    porta.setAttribute("aria-label", liberada ? "Entrar na fase " + fase : "Fase " + fase + " concluída");
    porta.addEventListener("click", () => entrar(index));
    corredor.appendChild(porta);
  });

  function entrar(index) {
    if (entrando || index + 1 > liberadaAte) return;
    entrando = true;
    aviso.textContent = "ENTRANDO NA FASE " + (index + 1) + "...";
    window.location.href = destinos[index];
  }

  function atualizarZero() {
    const largura = zero.offsetWidth || 60;
    const altura = zero.offsetHeight || 60;
    x = Math.max(0, Math.min(window.innerWidth - largura, x));
    y = Math.max(115, Math.min(window.innerHeight - altura - 20, y));
    zero.style.left = x + "px";
    zero.style.top = y + "px";
    zero.style.bottom = "auto";

    const z = zero.getBoundingClientRect();
    portaProxima = Array.from(document.querySelectorAll(".porta.liberada")).find(porta => {
      const p = porta.getBoundingClientRect();
      return z.right > p.left && z.left < p.right && z.bottom > p.top && z.top < p.bottom;
    });
    if (portaProxima && !entrando) {
      aviso.textContent = "FASE " + portaProxima.dataset.fase + " DISPONÍVEL — APERTE F PARA ENTRAR";
    }
  }

  function animar() {
    let dx = 0;
    let dy = 0;
    if (teclas.has("a")) dx -= 4;
    if (teclas.has("d")) dx += 4;
    if (teclas.has("w")) dy -= 4;
    if (teclas.has("s")) dy += 4;
    const andando = dx || dy;
    zero.classList.toggle("andando", Boolean(andando));
    if (andando) {
      x += dx;
      y += dy;
      atualizarZero();
    }
    requestAnimationFrame(animar);
  }

  document.addEventListener("keydown", event => {
    const tecla = teclaPorSeta[event.key] || event.key.toLowerCase();
    if (["w", "a", "s", "d"].includes(tecla)) {
      event.preventDefault();
      teclas.add(tecla);
    }
    if (tecla === "f" && portaProxima) {
      event.preventDefault();
      entrar(Number(portaProxima.dataset.fase) - 1);
    }
  });
  document.addEventListener("keyup", event => {
    teclas.delete(teclaPorSeta[event.key] || event.key.toLowerCase());
  });

  document.querySelectorAll("[data-move]").forEach(button => {
    const stop = event => {
      teclas.delete(button.dataset.move);
      if (event.type === "pointerup" && button.hasPointerCapture(event.pointerId)) {
        button.releasePointerCapture(event.pointerId);
      }
    };
    button.addEventListener("pointerdown", event => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      teclas.add(button.dataset.move);
    });
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("lostpointercapture", stop);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) teclas.clear();
  });
  window.addEventListener("resize", atualizarZero);
  atualizarZero();
  requestAnimationFrame(animar);
});