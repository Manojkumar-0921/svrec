// Subject details: syllabus, materials, previous papers, important questions
const panel = document.getElementById('panel'), id = qp('subject');
const fileBtn = url => url ? `<a class="btn sm ghost" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open</a>` : '';
(async () => {
  if (!id) return panel.innerHTML = errorHtml('No subject selected.');
  panel.innerHTML = loadingHtml();
  try {
    const [s, mats, papers, qs] = await Promise.all([apiGet('/api/subjects/' + id), apiGet('/api/materials/subject/' + id), apiGet('/api/papers/subject/' + id), apiGet('/api/questions/subject/' + id)]);
    document.title = s.subjectName + ' | SVREC Academic Hub';
    document.getElementById('title').textContent = s.subjectName;
    document.getElementById('sub').textContent = `${s.subjectCode} · Semester ${s.semesterId}`;
    document.getElementById('crumbs').innerHTML = `<a href="departments.html">Departments</a> / <a href="subjects.html?dept=${s.departmentId}&sem=${s.semesterId}">Back to subjects</a>`;
    const list = (arr, fn, msg) => arr.length ? `<div class="card"><ul class="list">${arr.map(fn).join('')}</ul></div>` : emptyHtml(msg);
    const tabs = {
      'Syllabus': () => s.syllabus ? `<div class="card"><pre style="white-space:pre-wrap;font:inherit;margin:0">${esc(s.syllabus)}</pre></div>` : emptyHtml('Syllabus not added yet.'),
      'Study Materials': () => list(mats, m => `<li><div><strong>${esc(m.title)}</strong><br><span class="muted">${esc(m.description)}</span></div>${fileBtn(m.fileUrl)}</li>`, 'No study materials yet.'),
      'Previous Papers': () => list([...papers].sort((a, b) => b.year - a.year), p => `<li><div><strong>${esc(p.title)}</strong> <span class="tag">${esc(p.year)}</span></div>${fileBtn(p.fileUrl)}</li>`, 'No previous papers yet.'),
      'Important Questions': () => list(qs, x => `<li><span>${esc(x.question)}</span><span class="tag">${esc(x.marks)} marks</span></li>`, 'No important questions yet.')
    };
    const box = document.getElementById('tabs');
    const select = name => { [...box.children].forEach(b => b.setAttribute('aria-selected', b.textContent === name)); panel.innerHTML = tabs[name](); };
    box.innerHTML = Object.keys(tabs).map(n => `<button role="tab">${n}</button>`).join('');
    [...box.children].forEach(b => b.onclick = () => select(b.textContent));
    select('Syllabus');
  } catch (e) { panel.innerHTML = errorHtml(e.message); }
})();
