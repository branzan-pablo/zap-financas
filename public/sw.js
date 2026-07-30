/**
 * Service worker mínimo e DELIBERADAMENTE conservador.
 *
 * Por que existe: o Chrome só oferece "instalar app" quando há um service worker
 * com handler de fetch. É esse o objetivo aqui — nada mais.
 *
 * Por que NÃO faz cache de dados: este é um app financeiro. Servir saldo, fatura
 * ou extrato de um cache seria pior do que não funcionar: o usuário tomaria
 * decisão com número errado sem saber. Então nenhuma resposta de navegação, de
 * API ou de página é cacheada — tudo vai para a rede.
 *
 * Só assets versionados e imutáveis do build (/_next/static/*) são cacheados:
 * o nome do arquivo muda a cada deploy, então não existe risco de conteúdo velho.
 */
const CACHE = "zapfin-static-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Limpa versões antigas deste cache.
      const nomes = await caches.keys();
      await Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Somente GET de assets imutáveis do build entram no cache.
  const url = new URL(req.url);
  const cacheavel =
    req.method === "GET" &&
    url.origin === self.location.origin &&
    url.pathname.startsWith("/_next/static/");

  if (!cacheavel) return; // passa direto para a rede (comportamento padrão)

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    })()
  );
});
