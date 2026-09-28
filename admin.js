// Admin dashboard: one generic CRUD table driven by the RES config below.
if (!requireAuth('ADMIN')) throw new Error('redirecting');
const view = document.getElementById('view'), dlg = document.getElementById('dlg');
const LOOK = { departments: [], semesters: [], subjects: [] };   // lookup lists for dropdowns
const opts = {
  dept: () => LOOK.departments.map(d => ({ v: d.id, l: `${d.code} - ${d.name}` })),
  sem: () => LOOK.semesters.map(s => ({ v: s.id, l: 'Semester ' + s.semesterNumber })),
  subj: () => LOOK.subjects.map(s => ({ v: s.id, l: `${s.subjectCode} - ${s.subjectName}` }))
};
// k = JSON key, l = label, t = input type, o = dropdown options
const RES = {
  departments: { label: 'Departments', one: 'department', cols: ['code', 'name'], fields: [{ k: 'name', l: 'Name', t: 'text' }, { k: 'code', l: 'Code (e.g. CSE)', t: 'text' }] },
  semesters: { label: 'Semesters', one: 'semester', cols: ['semesterNumber'], fields: [{ k: 'semesterNumber', l: 'Semester number', t: 'number', min: 1 }] },
  subjects: { label: 'Subjects', one: 'subject', cols: ['subjectCode', 'subjectName', 'departmentId', 'semesterId'], fields: [{ k: 'subjectName', l: 'Subject name', t: 'text' }, { k: 'subjectCode', l: 'Subject code', t: 'text' }, { k: 'departmentId', l: 'Department', t: 'select', o: opts.dept }, { k: 'semesterId', l: 'Semester', t: 'select', o: opts.sem }, { k: 'syllabus', l: 'Syllabus (optional)', t: 'textarea', optional: true }] },
  materials: { label: 'Materials', one: 'material', cols: ['title', 'subjectId', 'fileUrl'], fields: [{ k: 'title', l: 'Title', t: 'text' }, { k: 'description', l: 'Description', t: 'textarea', optional: true }, { k: 'fileUrl', l: 'File URL (PDF link)', t: 'url' }, { k: 'subjectId', l: 'Subject', t: 'select', o: opts.subj }] },
  papers: { label: 'Previous papers', one: 'paper', cols: ['title', 'year', 'subjectId'], fields: [{ k: 'title', l: 'Title', t: 'text' }, { k: 'year', l: 'Year', t: 'number', min: 1990 }, { k: 'fileUrl', l: 'File URL (PDF link)', t: 'url' }, { k: 'subjectId', l: 'Subject', t: 'select', o: opts.subj }] },
  questions: { label: 'Important questions', one: 'question', cols: ['question', 'marks', 'subjectId'], fields: [{ k: 'question', l: 'Question', t: 'textarea' }, { k: 'marks', l: 'Marks', t: 'number', min: 1 }, { k: 'subjectId', l: 'Subject', t: 'select', o: opts.subj }] }
};
const TABS = ['overview', ...Object.keys(RES), 'students'];
const TAB_LABEL = { overview: 'Overview', students: 'Students' };
let current = 'overview', editing = null;

async function loadLookups() { for (const k of Object.keys(LOOK)) LOOK[k] = await apiGet('/api/' + k); }
function cell(r, key) {   // show names instead of numeric foreign keys
  const f = (RES[r.res].fields.find(x => x.k === key) || {}), v = r.row[key];
  if (f.t === 'select') { const o = f.o().find(x => x.v == v); return esc(o ? o.l : v); }
  const t = String(v ?? ''); return esc(t.length > 70 ? t.slice(0, 70) + '…' : t);
}
function drawTabs() {
  const box = document.getElementById('tabs');
  box.innerHTML = TABS.map(t => `<button role="tab" data-t="${t}" aria-selected="${t === current}">${TAB_LABEL[t] || RES[t].label}</button>`).join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => { current = b.dataset.t; drawTabs(); draw(); });
}
async function draw() {
  view.innerHTML = loadingHtml();
  try {
    if (current === 'overview') {
      const s = await apiGet('/api/admin/stats');
      view.innerHTML = '<div class="grid">' + Object.entries(s).map(([k, v]) => `<div class="card"><div class="stat">${v}</div><span class="muted">${esc(k)}</span></div>`).join('') + '</div>';
    } else if (current === 'students') {
      const st = await apiGet('/api/admin/students');
      view.innerHTML = st.length ? `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Semester</th></tr></thead><tbody>${st.map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.department)}</td><td>${esc(u.semester)}</td></tr>`).join('')}</tbody></table></div>` : emptyHtml('No students have registered yet.');
    } else {
      const cfg = RES[current], rows = await apiGet('/api/' + current);
      view.innerHTML = `<div class="actions" style="margin:0 0 1rem"><button class="btn" id="add">Add ${cfg.one}</button></div>` + (rows.length
        ? `<div class="table-wrap"><table><thead><tr>${cfg.cols.map(c => `<th>${esc(c)}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${rows.map(row => `<tr>${cfg.cols.map(c => `<td>${cell({ res: current, row }, c)}</td>`).join('')}<td class="act"><button class="btn sm ghost" data-edit="${row.id}">Edit</button><button class="btn sm danger" data-del="${row.id}">Delete</button></td></tr>`).join('')}</tbody></table></div>`
        : emptyHtml(`No ${cfg.label.toLowerCase()} yet. Add the first one.`));
      document.getElementById('add').onclick = () => openForm(null);
      view.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openForm(rows.find(r => r.id == b.dataset.edit)));
      view.querySelectorAll('[data-del]').forEach(b => b.onclick = () => remove(b.dataset.del));
    }
  } catch (e) { view.innerHTML = errorHtml(e.message); }
}
function openForm(row) {
  editing = row; const cfg = RES[current];
  document.getElementById('dtitle').textContent = (row ? 'Edit ' : 'Add ') + cfg.one;
  document.getElementById('derr').innerHTML = '';
  document.getElementById('dfields').innerHTML = cfg.fields.map(f => {
    const id = 'f_' + f.k, v = row ? row[f.k] : '', req = f.optional ? '' : 'required';
    const input = f.t === 'textarea' ? `<textarea id="${id}" rows="3" ${req}>${esc(v)}</textarea>`
      : f.t === 'select' ? `<select id="${id}" ${req}><option value="">Select…</option>${f.o().map(o => `<option value="${o.v}" ${o.v == v ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}</select>`
      : `<input id="${id}" type="${f.t}" value="${esc(v)}" ${f.min != null ? 'min="' + f.min + '"' : ''} ${req}>`;
    return `<label for="${id}">${esc(f.l)}${input}</label>`;
  }).join('');
  dlg.showModal();
}
document.getElementById('dcancel').onclick = () => dlg.close();
document.getElementById('dform').onsubmit = async e => {
  e.preventDefault(); const cfg = RES[current], body = {}, err = document.getElementById('derr');
  for (const f of cfg.fields) {
    let v = document.getElementById('f_' + f.k).value.trim();
    if (!v && !f.optional) return err.innerHTML = errorHtml(`${f.l} is required.`);
    if (f.t === 'url' && !/^https?:\/\//i.test(v)) return err.innerHTML = errorHtml('File URL must start with http:// or https://');
    body[f.k] = (f.t === 'number' || f.t === 'select') && v !== '' ? Number(v) : v;
  }
  const btn = document.getElementById('dsave'); btn.disabled = true;
  try {
    await apiSend(editing ? 'PUT' : 'POST', `/api/${current}${editing ? '/' + editing.id : ''}`, body);
    dlg.close(); toast(editing ? 'Changes saved' : 'Added successfully');
    if (LOOK[current]) await loadLookups();
    draw();
  } catch (ex) { err.innerHTML = errorHtml(ex.message); } finally { btn.disabled = false; }
};
async function remove(id) {
  if (!confirm('Delete this ' + RES[current].one + '? This cannot be undone.')) return;
  try { await apiSend('DELETE', `/api/${current}/${id}`); toast('Deleted'); if (LOOK[current]) await loadLookups(); draw(); }
  catch (e) { toast(e.message, 'error'); }
}
(async () => { try { await loadLookups(); } catch (e) { toast(e.message, 'error'); } drawTabs(); draw(); })();
