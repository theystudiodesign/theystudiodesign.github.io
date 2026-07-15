// Tiny history router (~static host serves 404.html as the shell). Lazy-imports views.
const routes = [
  { re: /^\/$/, view: "dashboard" },
  { re: /^\/projects$/, view: "projects" },
  { re: /^\/projects\/([^/]+)$/, view: "project", params: ["id"] },
  { re: /^\/deliverables$/, view: "deliverables" },
  { re: /^\/deliverables\/([^/]+)$/, view: "deliverable", params: ["id"] },
  { re: /^\/files$/, view: "files" },
  { re: /^\/invoices$/, view: "invoices" },
  { re: /^\/meetings$/, view: "meetings" },
  { re: /^\/notes$/, view: "notes" },
  { re: /^\/profile$/, view: "profile" },
];

let _outlet, _onNavigate;

export function initRouter(outlet, onNavigate) {
  _outlet = outlet; _onNavigate = onNavigate;
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-link]");
    if (!a) return;
    e.preventDefault();
    navigate(a.getAttribute("href"));
  });
  window.addEventListener("popstate", () => resolve(location.pathname));
  resolve(location.pathname);
}

export function navigate(path) {
  if (path === location.pathname) return;
  history.pushState({}, "", path);
  resolve(path);
}

async function resolve(path) {
  const match = routes.find((r) => r.re.test(path));
  const found = match || { view: "notfound" };
  const m = match ? path.match(match.re) : null;
  const params = {};
  if (match && match.params) match.params.forEach((p, i) => (params[p] = decodeURIComponent(m[i + 1])));

  _outlet.innerHTML = '<div class="content"><div class="skel" style="height:40vh"></div></div>';
  try {
    const mod = await import(`./views/${found.view}.js`);
    await mod.render(_outlet, params);
  } catch (err) {
    console.error(err);
    _outlet.innerHTML = `<div class="content"><div class="empty"><p class="h3">Something went sideways.</p><p>${err.message}</p></div></div>`;
  }
  if (_onNavigate) _onNavigate(path);
  window.scrollTo(0, 0);
}
