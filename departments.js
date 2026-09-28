// Step 1: choose department. Step 2 (?dept=ID): choose semester.
const cards = document.getElementById('cards'), deptId = qp('dept');
(async () => {
  cards.innerHTML = loadingHtml();
  try {
    const depts = await apiGet('/api/departments');
    if (!deptId) {
      cards.innerHTML = depts.map(d => `<a class="card" href="departments.html?dept=${d.id}"><span class="tag">${esc(d.code)}</span><h3 style="margin-top:.5rem">${esc(d.name)}</h3></a>`).join('') || emptyHtml('No departments available.');
      return;
    }
    const d = depts.find(x => x.id == deptId);
    if (!d) return cards.innerHTML = errorHtml('Department not found.');
    document.getElementById('title').textContent = d.name + ' - choose semester';
    document.getElementById('crumbs').innerHTML = `<a href="departments.html">Departments</a> / ${esc(d.code)}`;
    const sems = await apiGet('/api/semesters');
    cards.innerHTML = sems.map(s => `<a class="card" href="subjects.html?dept=${d.id}&sem=${s.id}"><h3>Semester ${s.semesterNumber}</h3><span class="muted">View subjects</span></a>`).join('') || emptyHtml('No semesters available.');
  } catch (e) { cards.innerHTML = errorHtml(e.message); }
})();
