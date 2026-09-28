// Student dashboard
const user = requireAuth();
if (user) (async () => {
  document.getElementById('hello').textContent = 'Hello, ' + user.name;
  document.getElementById('meta').textContent = user.role === 'ADMIN' ? 'Administrator' : `${user.department} · Semester ${user.semester}`;
  ['mats', 'papers', 'qs'].forEach(id => document.getElementById(id).innerHTML = loadingHtml());
  try {
    const [depts, subjects, mats, papers] = await Promise.all(['departments', 'subjects', 'materials', 'papers'].map(r => apiGet('/api/' + r)));
    const dept = depts.find(d => d.code === user.department);
    document.getElementById('quick').innerHTML = [
      dept ? [`subjects.html?dept=${dept.id}&sem=${user.semester}`, 'My subjects', `${user.department}, semester ${user.semester}`] : null,
      ['departments.html', 'Browse departments', 'Pick any department and semester']
    ].filter(Boolean).map(([h, t, s]) => `<a class="card" href="${h}"><h3>${t}</h3><p class="muted" style="margin:0">${s}</p></a>`).join('');
    // Show items for the student's own department first (admins see everything)
    const mine = new Set(subjects.filter(s => !dept || s.departmentId === dept.id).map(s => s.id));
    const name = id => (subjects.find(s => s.id === id) || {}).subjectName || 'Subject';
    const link = id => `materials.html?subject=${id}`;
    const row = (t, id, extra) => `<li><a href="${link(id)}">${esc(t)}</a><span class="muted">${esc(name(id))}${extra ? ' · ' + esc(extra) : ''}</span></li>`;
    const show = (el, arr, fn, msg) => document.getElementById(el).innerHTML = arr.length ? `<div class="card"><ul class="list">${arr.map(fn).join('')}</ul></div>` : emptyHtml(msg);
    show('mats', mats.filter(m => mine.has(m.subjectId)).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).slice(0, 5), m => row(m.title, m.subjectId, new Date(m.uploadedAt).toLocaleDateString()), 'No materials added yet.');
    show('papers', papers.filter(p => mine.has(p.subjectId)).sort((a, b) => b.year - a.year).slice(0, 5), p => row(p.title, p.subjectId, p.year), 'No previous papers yet.');
    // Important questions are fetched per subject
    const lists = await Promise.all([...mine].slice(0, 8).map(id => apiGet('/api/questions/subject/' + id)));
    show('qs', lists.flat().slice(0, 5), q => row(q.question, q.subjectId, q.marks + ' marks'), 'No important questions yet.');
  } catch (e) { ['mats', 'papers', 'qs'].forEach(id => document.getElementById(id).innerHTML = errorHtml(e.message)); }
})();
