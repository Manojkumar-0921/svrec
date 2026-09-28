// Single place where the frontend talks to the backend (REST + JWT).
// Every backend response is { success, message, data }.
async function api(path, options = {}) {
  if (CONFIG.DEMO_MODE) return demoApi(path, options);   // removed in STEP 7
  const headers = { 'Content-Type': 'application/json' };
  if (Session.token) headers.Authorization = 'Bearer ' + Session.token;
  let res;
  try { res = await fetch(CONFIG.API_BASE + path, { ...options, headers }); }
  catch (e) { throw new Error('Cannot reach the server. Check that the backend is running.'); }
  let body = null;
  try { body = await res.json(); } catch (e) { /* empty body */ }
  if (res.status === 401 && Session.token) { Session.clear(); location.href = 'login.html'; }
  if (!res.ok || (body && body.success === false)) throw new Error((body && body.message) || `Request failed (${res.status})`);
  return body;
}
const apiGet = async p => (await api(p)).data;
const apiSend = (method, path, data) => api(path, { method, body: data ? JSON.stringify(data) : undefined });
