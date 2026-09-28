// Shared helpers: session, navbar, toast, escaping, guards.
const Session = {
  get token() { return localStorage.getItem('svrec_token'); },
  get user() { try { return JSON.parse(localStorage.getItem('svrec_user')); } catch (e) { return null; } },
  save(token, user) { localStorage.setItem('svrec_token', token); localStorage.setItem('svrec_user', JSON.stringify(user)); },
  clear() { localStorage.removeItem('svrec_token'); localStorage.removeItem('svrec_user'); }
};
// Escape text before inserting into HTML (prevents XSS)
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function qp(name) { return new URLSearchParams(location.search).get(name); }
const loadingHtml = () => '<div class="loading" role="status"><span class="spinner"></span> Loading…</div>';
const emptyHtml = msg => `<div class="empty">${esc(msg)}</div>`;
const errorHtml = msg => `<div class="alert error" role="alert">${esc(msg)}</div>`;
function toast(message, type = 'success') {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = 'toast ' + (type === 'error' ? 'error' : '');
  t.textContent = message; box.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
function logout() { Session.clear(); location.href = 'login.html'; }
// Redirect if not logged in (or not admin when role === 'ADMIN')
function requireAuth(role) {
  const u = Session.user;
  if (!Session.token || !u) { location.href = 'login.html'; return null; }
  if (role === 'ADMIN' && u.role !== 'ADMIN') { location.href = 'dashboard.html'; return null; }
  return u;
}
function renderNav(active) {
  const u = Session.user, links = [['index.html', 'Home'], ['departments.html', 'Departments']];
  if (u) links.push(['dashboard.html', 'Dashboard']);
  if (u && u.role === 'ADMIN') links.push(['admin.html', 'Admin']);
  const a = links.map(([h, t]) => `<a href="${h}" class="${h === active ? 'active' : ''}">${t}</a>`).join('');
  const auth = u ? `<a href="#" id="logoutLink">Logout (${esc(u.name.split(' ')[0])})</a>` : `<a href="login.html" class="${active === 'login.html' ? 'active' : ''}">Login</a>`;
  document.getElementById('nav').innerHTML = `<nav class="nav" aria-label="Main"><div class="nav-in">
    <a class="brand" href="index.html">SVREC Academic Hub</a>
    <button class="btn ghost sm nav-toggle" aria-expanded="false" aria-controls="navLinks">Menu</button>
    <div class="nav-links" id="navLinks">${a}${auth}</div></div></nav>`;
  const toggle = document.querySelector('.nav-toggle'), menu = document.getElementById('navLinks');
  toggle.onclick = () => { const o = menu.classList.toggle('open'); toggle.setAttribute('aria-expanded', o); };
  const lo = document.getElementById('logoutLink'); if (lo) lo.onclick = e => { e.preventDefault(); logout(); };
  const f = document.getElementById('footer');
  if (f) f.innerHTML = '<div class="footer">SVR Engineering College, Nandyal, Andhra Pradesh · SVREC Academic Hub</div>';
}
