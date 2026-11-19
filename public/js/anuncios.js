/* Exibe anúncios cadastrados pelo painel; usa as artes locais como fallback. */
(function () {
  "use strict";
  var slots = Array.prototype.slice.call(document.querySelectorAll("[data-ad-slot]"));
  if (!slots.length) return;
  var mobile = window.matchMedia("(max-width: 767px)");
  var cache = { largo: null, alto: null, quadrado: null };
  var tempos = { largo: 15000, alto: 15000, quadrado: 15000 };

  function formato(slot) {
    /* A proporção extrema 1:3 força o layout desktop mesmo com viewport estreita. */
    var layoutDesktopForcado = window.innerWidth / Math.max(window.innerHeight, 1) <= (1 / 3);
    return mobile.matches && !layoutDesktopForcado
      ? (slot.dataset.adMobileFormat || "quadrado")
      : (slot.dataset.adDesktopFormat || "largo");
  }
  async function carregar(formato) {
    if (cache[formato] !== null) return cache[formato];
    try {
      var resposta = await fetch("/api/anuncios?formato=" + encodeURIComponent(formato), { cache: "no-store" });
      cache[formato] = resposta.ok ? await resposta.json() : [];
    } catch (_) { cache[formato] = []; }
    return cache[formato];
  }
  function aplicar(slot, formato, indice, anuncios) {
    var img = slot.querySelector(".ad-imagem");
    if (!img) return;
    slot.classList.remove("ad-slot-largo", "ad-slot-alto", "ad-slot-quadrado");
    slot.classList.add("ad-slot-" + formato);
    slot.dataset.adFormat = formato;
    var anuncio = anuncios.length ? anuncios[indice % anuncios.length] : null;
    img.src = anuncio ? anuncio.imagem : ("/img/anuncios/anuncio-" + formato + "-" + ((indice % 3) + 1) + ".png");
    img.alt = anuncio ? anuncio.titulo : "Anúncio demonstrativo";
    img.onerror = function () {
      img.onerror = null;
      img.src = "/img/anuncios/anuncio-" + formato + "-1.png";
    };
  }
  function iniciarSlot(slot) {
    var indice = 0, atual = "";
    async function atualizar() {
      var novoFormato = formato(slot);
      if (novoFormato !== atual) { atual = novoFormato; indice = 0; }
      var anuncios = await carregar(atual);
      aplicar(slot, atual, indice, anuncios);
      indice++;
      window.clearTimeout(slot._adTimer);
      slot._adTimer = window.setTimeout(atualizar, tempos[atual] || 15000);
    }
    atualizar();
  }
  slots.forEach(iniciarSlot);
  function mudar() {
    slots.forEach(function (slot) {
      if (slot.dataset.adFormat !== formato(slot)) {
        window.clearTimeout(slot._adTimer);
        iniciarSlot(slot);
      }
    });
  }
  if (mobile.addEventListener) mobile.addEventListener("change", mudar);
  else if (mobile.addListener) mobile.addListener(mudar);
  window.addEventListener("resize", mudar);
})();
