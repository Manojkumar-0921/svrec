// Subject list by department + semester, or search results when ?q= is present.
const out = document.getElementById('out'), q = (qp('q') || '').trim(), dept = qp('dept'), sem = qp('sem');
document.getElementById('q').value = q;
const subjectCard = s => `<a class="card" href="materials.html?subject=${s.id}"><span class="tag">${esc(s.subjectCode)}</span><h3 style="margin-top:.5rem">${esc(s.subjectName)}</h3><span class="muted">Semester ${s.semesterId}</span></a>`;
(async () => {
  out.innerHTML = loadingHtml();
  try {
    if (q) {   // ---- search mode ----
      document.getElementById('title').textContent = `Results for "${q}"`;
      const r = await apiGet('/api/search?q=' + encodeURIComponent(q));
      const total = r.subjects.length + r.materials.length + r.papers.length + r.questions.length;
      if (!total) return out.innerHTML = emptyHtml('No results found. Try a different keyword.');
      const sec = (t, arr, fn) => arr.length ? `<h2 class="section-title">${t}</h2><div class="card"><ul class="list">${arr.map(fn).join('')}</ul></div>` : '';
      const go = (id, t, x) => `<li><a href="materials.html?subject=${id}">${esc(t)}</a><span class="muted">${esc(x || '')}</span></li>`;
      out.innerHTML = (r.subjects.length ? `<h2 class="section-title">Subjects</h2><div class="grid">${r.subjects.map(subjectCard).join('')}</div>` : '')
        + sec('Study materials', r.materials, m => go(m.subjectId, m.title, m.description))
        + sec('Previous papers', r.papers, p => go(p.subjectId, p.title, p.year))
        + sec('Important questions', r.questions, x => go(x.subjectId, x.question, x.marks + ' marks'));
      return;
    }
    // ---- browse mode ----
    if (!dept || !sem) return out.innerHTML = emptyHtml('Choose a department and semester first.') + '<p style="text-align:center"><a class="btn" href="departments.html">Browse departments</a></p>';
    const d = (await apiGet('/api/departments')).find(x => x.id == dept);
    document.getElementById('title').textContent = `${d ? d.code : ''} - Semester ${sem}`;
    document.getElementById('crumbs').innerHTML = `<a href="departments.html">Departments</a> / <a href="departments.html?dept=${dept}">${esc(d ? d.code : '')}</a> / Semester ${esc(sem)}`;
    const subs = await apiGet(`/api/subjects?departmentId=${encodeURIComponent(dept)}&semesterId=${encodeURIComponent(sem)}`);
    out.innerHTML = subs.length ? `<div class="grid">${subs.map(subjectCard).join('')}</div>` : emptyHtml('No subjects have been added for this semester yet.');
  } catch (e) { out.innerHTML = errorHtml(e.message); }
})();
