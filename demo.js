// TEMPORARY in-browser stand-in for the Spring Boot API so Step 1 can be tested.
// It mimics the same URLs and JSON envelope. Set CONFIG.DEMO_MODE=false in STEP 7 and delete this file.
const DEMO_KEY = 'svrec_demo_db_v1';
const SEED = {
  nextId: 1000,
  departments: [[1,'CSE','Computer Science and Engineering'],[2,'AI','Artificial Intelligence'],[3,'ECE','Electronics and Communication Engineering'],[4,'EEE','Electrical and Electronics Engineering'],[5,'MECH','Mechanical Engineering'],[6,'CIVIL','Civil Engineering']].map(([id,code,name]) => ({ id, code, name })),
  semesters: [1,2,3,4,5,6,7,8].map(n => ({ id: n, semesterNumber: n })),
  subjects: [[1,'Data Structures','CS301',1,3],[2,'Database Management Systems','CS302',1,3],[3,'Object Oriented Programming through Java','CS303',1,3],[4,'Operating Systems','CS501',1,5],[5,'Computer Networks','CS502',1,5],[6,'Python for AI','AI301',2,3],[7,'Machine Learning','AI501',2,5],[8,'Analog Circuits','EC301',3,3],[9,'Electrical Circuit Analysis','EE301',4,3],[10,'Thermodynamics','ME301',5,3],[11,'Strength of Materials','CE301',6,3],[12,'Engineering Mathematics-I','MA101',1,1]]
    .map(([id,subjectName,subjectCode,departmentId,semesterId]) => ({ id, subjectName, subjectCode, departmentId, semesterId, syllabus: 'Unit 1: Fundamentals\nUnit 2: Core concepts\nUnit 3: Applications\nUnit 4: Advanced topics\nUnit 5: Case studies' })),
  materials: [[1,'Data Structures Unit 1 Notes','Arrays, linked lists, stacks and queues',1],[2,'Trees and Graphs Notes','Unit 3 and 4 handwritten notes',1],[3,'DBMS Normalization Guide','1NF to BCNF with examples',2],[4,'OS Process Scheduling','Scheduling algorithms explained',4]]
    .map(([id,title,description,subjectId]) => ({ id, title, description, subjectId, fileUrl: 'https://example.com/sample.pdf', uploadedAt: new Date(Date.now() - id * 864e5).toISOString() })),
  papers: [[1,'Data Structures - Regular Exam',2024,1],[2,'Data Structures - Supplementary',2023,1],[3,'DBMS - Regular Exam',2024,2]].map(([id,title,year,subjectId]) => ({ id, title, year, subjectId, fileUrl: 'https://example.com/sample.pdf' })),
  questions: [[1,'Explain the difference between a stack and a queue with examples.',5,1],[2,'Write an algorithm for BFS and analyse its complexity.',10,1],[3,'What is normalization? Explain 3NF with an example.',10,2]].map(([id,question,marks,subjectId]) => ({ id, question, marks, subjectId })),
  users: [
    { id: 1, name: 'SVREC Admin', email: 'admin@svrec.ac.in', password: 'admin123', role: 'ADMIN', department: null, semester: null },
    { id: 2, name: 'Ravi Kumar', email: 'student@svrec.ac.in', password: 'student123', role: 'STUDENT', department: 'CSE', semester: 3 }
  ]
};
const DemoDB = {
  get() { try { return JSON.parse(localStorage.getItem(DEMO_KEY)) || this.reset(); } catch (e) { return this.reset(); } },
  set(db) { localStorage.setItem(DEMO_KEY, JSON.stringify(db)); },
  reset() { localStorage.setItem(DEMO_KEY, JSON.stringify(SEED)); return JSON.parse(JSON.stringify(SEED)); }
};
const dOk = (data, message = 'OK') => ({ success: true, message, data });
const dSafeUser = u => { const { password, ...rest } = u; return rest; };

function demoApi(path, o = {}) {
  return new Promise((resolve, reject) => setTimeout(() => {
    try { resolve(demoRoute(path, (o.method || 'GET').toUpperCase(), o.body ? JSON.parse(o.body) : null)); }
    catch (e) { reject(e); }
  }, 250));
}
function demoRoute(path, method, body) {
  const db = DemoDB.get(), [p, qs] = path.split('?'), params = new URLSearchParams(qs || '');
  const parts = p.replace(/^\/api\//, '').split('/'), res = parts[0];
  const me = Session.user;
  if (res === 'auth') {
    if (parts[1] === 'login') {
      const u = db.users.find(x => x.email === (body.email || '').toLowerCase() && x.password === body.password);
      if (!u) throw new Error('Invalid email or password');
      return dOk({ token: 'demo-token-' + u.id, user: dSafeUser(u) }, 'Login successful');
    }
    if (parts[1] === 'register') {
      const email = (body.email || '').toLowerCase();
      if (!email.endsWith(CONFIG.EMAIL_DOMAIN)) throw new Error('Only @svrec.ac.in emails are allowed');
      if (db.users.some(x => x.email === email)) throw new Error('Email is already registered');
      db.users.push({ id: db.nextId++, name: body.name, email, password: body.password, role: 'STUDENT', department: body.department, semester: Number(body.semester) });
      DemoDB.set(db); return dOk(null, 'Registration successful');
    }
  }
  if (res === 'admin') {
    if (!me || me.role !== 'ADMIN') throw new Error('Access denied: admin only');
    if (parts[1] === 'students') return dOk(db.users.filter(u => u.role === 'STUDENT').map(dSafeUser));
    if (parts[1] === 'stats') return dOk({ students: db.users.filter(u => u.role === 'STUDENT').length, departments: db.departments.length, subjects: db.subjects.length, materials: db.materials.length, papers: db.papers.length, questions: db.questions.length });
  }
  if (res === 'search') {
    const q = (params.get('q') || '').toLowerCase(), has = (...f) => f.some(v => String(v).toLowerCase().includes(q));
    return dOk({ subjects: db.subjects.filter(s => has(s.subjectName, s.subjectCode)), materials: db.materials.filter(m => has(m.title, m.description)), papers: db.papers.filter(x => has(x.title, x.year)), questions: db.questions.filter(x => has(x.question)) });
  }
  const list = db[res];
  if (!list) throw new Error('Unknown endpoint');
  if (method !== 'GET' && (!me || me.role !== 'ADMIN')) throw new Error('Access denied: admin only');
  if (method === 'GET') {
    if (parts[1] === 'subject') return dOk(list.filter(x => x.subjectId == parts[2]));
    if (parts[1]) { const it = list.find(x => x.id == parts[1]); if (!it) throw new Error('Not found'); return dOk(it); }
    if (res === 'subjects') return dOk(list.filter(s => (!params.get('departmentId') || s.departmentId == params.get('departmentId')) && (!params.get('semesterId') || s.semesterId == params.get('semesterId'))));
    return dOk(list);
  }
  if (method === 'POST') { const it = { ...body, id: db.nextId++ }; if (res === 'materials') it.uploadedAt = new Date().toISOString(); list.push(it); DemoDB.set(db); return dOk(it, 'Created'); }
  const i = list.findIndex(x => x.id == parts[1]); if (i < 0) throw new Error('Not found');
  if (method === 'PUT') { list[i] = { ...list[i], ...body, id: list[i].id }; DemoDB.set(db); return dOk(list[i], 'Updated'); }
  if (method === 'DELETE') { list.splice(i, 1); DemoDB.set(db); return dOk(null, 'Deleted'); }
  throw new Error('Unsupported request');
}
