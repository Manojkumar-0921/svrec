// Login + registration page
let mode = 'login';
const $ = id => document.getElementById(id);
const setMode = m => {
  mode = m;
  $('tabLogin').setAttribute('aria-selected', m === 'login'); $('tabReg').setAttribute('aria-selected', m === 'register');
  $('nameWrap').hidden = $('regFields').hidden = m === 'login';
  $('submit').textContent = m === 'login' ? 'Login' : 'Create account';
  $('password').autocomplete = m === 'login' ? 'current-password' : 'new-password'; $('msg').innerHTML = '';
};
$('tabLogin').onclick = () => setMode('login'); $('tabReg').onclick = () => setMode('register');
if (Session.token) location.href = Session.user.role === 'ADMIN' ? 'admin.html' : 'dashboard.html';

(async () => {   // fill registration dropdowns from the API
  try {
    const [d, s] = await Promise.all([apiGet('/api/departments'), apiGet('/api/semesters')]);
    $('department').innerHTML = d.map(x => `<option value="${esc(x.code)}">${esc(x.code)} - ${esc(x.name)}</option>`).join('');
    $('semester').innerHTML = s.map(x => `<option value="${x.semesterNumber}">Semester ${x.semesterNumber}</option>`).join('');
  } catch (e) { $('msg').innerHTML = errorHtml(e.message); }
})();

$('form').onsubmit = async e => {
  e.preventDefault(); const msg = $('msg'); msg.innerHTML = '';
  const email = $('email').value.trim().toLowerCase(), password = $('password').value, name = $('name').value.trim();
  if (!email.endsWith(CONFIG.EMAIL_DOMAIN) || email.length <= CONFIG.EMAIL_DOMAIN.length) return msg.innerHTML = errorHtml('Use your college email ending with ' + CONFIG.EMAIL_DOMAIN);
  if (!password) return msg.innerHTML = errorHtml('Enter your password.');
  if (mode === 'register') {
    if (name.length < 3) return msg.innerHTML = errorHtml('Enter your full name.');
    if (password.length < 8) return msg.innerHTML = errorHtml('Password must be at least 8 characters.');
  }
  const btn = $('submit'); btn.disabled = true;
  try {
    if (mode === 'register') {
      await apiSend('POST', '/api/auth/register', { name, email, password, department: $('department').value, semester: Number($('semester').value) });
      toast('Account created. Please log in.'); setMode('login');
    } else {
      const { data } = await apiSend('POST', '/api/auth/login', { email, password });
      Session.save(data.token, data.user);
      location.href = data.user.role === 'ADMIN' ? 'admin.html' : 'dashboard.html';
    }
  } catch (err) { msg.innerHTML = errorHtml(err.message); }
  finally { btn.disabled = false; }
};
