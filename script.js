// MediMinds - LocalStorage full prototype (fixed & robust)
const $ = id => document.getElementById(id);
let session = { role: null, name: null, patientId: null };

// Utility to generate a reasonably unique Patient ID (avoids collisions)
function genPatientId(name) {
  const base = (name || 'anon').replace(/\s+/g,'').toUpperCase().slice(0,6);
  const rand = Math.floor(Math.random()*90000)+10000;
  return 'MED' + base + rand.toString().slice(0,5);
}

// LocalStorage helpers
function loadAll(key){ try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){ console.error('parse error',key,e); return []; } }
function saveAll(key, arr){ localStorage.setItem(key, JSON.stringify(arr)); }
function ensureKey(key){ if(!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify([])); }
function addRecord(kind, obj){ const arr = loadAll(kind); arr.push(obj); saveAll(kind, arr); }
function addForPatient(kind, pid, obj){ obj.patientId = pid; obj._ts = new Date().toLocaleString(); addRecord(kind, obj); }
function queryForPatient(kind, pid){ return loadAll(kind).filter(x=>x.patientId===pid); }

// Ensure base keys exist
['patients','profiles','meds','prescriptions','tests','issues','appointments','moods','consults','consultReplies','contacts','visits','sos'].forEach(ensureKey);

// hide splash quickly
window.onload = ()=>{ setTimeout(()=>{ const s=$('splash'); if(s) s.style.display='none'; }, 600); };

// login flow
$('loginBtn').addEventListener('click', ()=>{
  const name = $('nameInput').value.trim() || 'Anonymous';
  const role = $('roleSelect').value;
  let pid = $('patientIdInput').value.trim();
  if(!pid){
    // generate until unique
    do { pid = genPatientId(name); } while(loadAll('patients').find(p=>p.patientId===pid));
  }
  // add patient entry if missing
  const patients = loadAll('patients');
  if(!patients.find(p=>p.patientId===pid)){
    patients.push({ patientId: pid, name: name, created: new Date().toLocaleString() });
    saveAll('patients', patients);
  }
  session = { role, name, patientId: pid };
  // small timeout to ensure localStorage writes settle
  setTimeout(afterLogin, 120);
});

function afterLogin(){
  // show dashboard and menus
  $('loginSection').classList.add('hidden');
  $('dashboard').classList.remove('hidden');
  $('welcome').innerText = `${session.name} (${session.role})`;
  $('patientIdDisplay').innerText = `Patient ID: ${session.patientId}`;
  const pm = $('patientMenu'); const hm = $('hospitalMenu');
  pm.innerHTML=''; hm.innerHTML='';
  if(session.role === 'patient'){
    pm.classList.remove('hidden'); hm.classList.add('hidden');
    addPatientMenuButtons(pm);
    showView('profile');
  } else {
    hm.classList.remove('hidden'); pm.classList.add('hidden');
    addHospitalMenuButtons(hm);
    showView('search');
    renderSOS(); // populate SOS for authority
  }
}

// logout
document.addEventListener('click', (e)=>{ if(e.target && e.target.id === 'logoutBtn'){ location.reload(); } });

// build menus
function addPatientMenuButtons(container){
  const items = [
    ['profile','👤 Profile & Contacts'],
    ['profiles','🗂 Disease Profiles'],
    ['medications','💊 Medications'],
    ['prescriptions','📋 Prescriptions'],
    ['tests','🧪 Tests & Results'],
    ['issues','📝 Issues'],
    ['appointments','⏰ Appointments'],
    ['mood','🙂 Mood Tracker'],
    ['consult','🩺 Consult Doctor'],
    ['sos','🚨 SOS']
  ];
  container.innerHTML='';
  items.forEach(it=>{ const b=document.createElement('button'); b.className='nav-btn'; b.innerText=it[1]; b.onclick=()=>showView(it[0]); container.appendChild(b); });
}

function addHospitalMenuButtons(container){
  const items = [
    ['search','🔍 Search Patient'],
    ['uploadPres','📤 Upload Prescription'],
    ['uploadTest','📤 Upload Test Result'],
    ['visits','🏥 Visits & Admits'],
    ['consultList','💬 Consult Requests'],
    ['soslog','🚑 SOS Requests']
  ];
  container.innerHTML='';
  items.forEach(it=>{ const b=document.createElement('button'); b.className='nav-btn'; b.innerText=it[1]; b.onclick=()=>showView(it[0]); container.appendChild(b); });
  const reset=document.createElement('button'); reset.className='nav-btn'; reset.innerText='🧹 Reset All Data'; reset.onclick=()=>{ if(confirm('Clear all demo data?')){ localStorage.clear(); alert('Cleared'); location.reload(); } }; container.appendChild(reset);
}

// view management - dynamic creation + renderers
function showView(view){
  const all = ['profile','profiles','medications','prescriptions','tests','issues','appointments','mood','consult','sos','search','uploadPres','uploadTest','visits','consultList','soslog'];
  const container = $('views');
  // create placeholders if missing
  all.forEach(v=>{ if(!document.getElementById('view-'+v)){ const s=document.createElement('section'); s.id='view-'+v; s.className='card hidden'; container.appendChild(s); } });
  // hide all then show target
  all.forEach(v=> document.getElementById('view-'+v).classList.add('hidden'));
  document.getElementById('view-'+view).classList.remove('hidden');
  // call renderer
  try{
    const fn = { profile: renderProfileView, profiles: renderDiseaseProfiles, medications: renderMedicationsView, prescriptions: renderPrescriptionsView, tests: renderTestsView, issues: renderIssuesView, appointments: renderAppointmentsView, mood: renderMoodView, consult: renderConsultView, sos: renderSOSPatientView, search: renderHospitalSearchView, uploadPres: renderUploadPrescriptionView, uploadTest: renderUploadTestView, visits: renderVisitsView, consultList: renderConsultListView, soslog: renderSOS }[view];
    if(fn) fn();
  } catch(e){ console.error('Renderer error for',view,e); }
}

// ---------- Renderers and actions ----------

// Profile view (patient)
function renderProfileView(){
  const el = $('view-profile'); const patient = loadAll('patients').find(p=>p.patientId===session.patientId);
  el.innerHTML = '<h3>Profile & Contacts</h3>';
  el.innerHTML += `<div class="muted">Name: ${patient ? patient.name : session.name}</div>`;
  el.innerHTML += `<label>Emergency contact name: <input id="ecName" /></label><label>Phone: <input id="ecPhone" /></label><button onclick="saveEmergencyContact()">Save Contact</button>`;
  const contacts = queryForPatient('contacts', session.patientId);
  el.innerHTML += '<h4>Contacts</h4>' + (contacts.length ? contacts.map(c=>`<div class="list-item">${c.name} — ${c.phone} <div class="muted">${c._ts}</div></div>`).join('') : '<div class="muted">No contacts</div>');
  const admits = queryForPatient('visits', session.patientId).filter(v=>v.type==='Admit');
  el.innerHTML += `<h4>Admissions: ${admits.length}</h4>`;
}
function saveEmergencyContact(){ const name = $('ecName').value.trim(); const phone = $('ecPhone').value.trim(); if(!name||!phone) return alert('Enter contact name and phone'); addForPatient('contacts', session.patientId, {name, phone}); renderProfileView(); }

// Disease profiles
function renderDiseaseProfiles(){
  const el = $('view-profiles'); el.innerHTML = '<h3>Disease Profiles</h3>';
  el.innerHTML += `<label>New profile name: <input id="newProfileName" /></label><button onclick="addDiseaseProfile()">Add Profile</button>`;
  const profiles = queryForPatient('profiles', session.patientId);
  el.innerHTML += '<h4>Profiles</h4>' + (profiles.length ? profiles.map(p=>`<div class="list-item"><b>${p.name}</b> <div class="muted">${p._ts}</div></div>`).join('') : '<div class="muted">No profiles</div>');
}
function addDiseaseProfile(){ const name = $('newProfileName').value.trim(); if(!name) return alert('Enter profile name'); addForPatient('profiles', session.patientId, {name}); renderDiseaseProfiles(); }

// Medications
function renderMedicationsView(){
  const el = $('view-medications'); el.innerHTML = '<h3>Medications</h3>';
  const profiles = queryForPatient('profiles', session.patientId);
  const profileOptions = profiles.length ? profiles.map(p=>`<option value="${p.name}">${p.name}</option>`).join('') : '<option value="">(no profiles)</option>';
  el.innerHTML += `<label>Profile: <select id="medProfileSelect">${profileOptions}</select></label>`;
  el.innerHTML += `<label>Medicine name: <input id="medName" /></label><label>Dosage: <input id="medDosage" /></label><button onclick="addMedicationToProfile()">Add Medication</button>`;
  const meds = queryForPatient('meds', session.patientId);
  el.innerHTML += '<h4>Medications</h4>' + (meds.length ? meds.map(m=>`<div class="list-item"><b>${m.name}</b> — ${m.dosage} <div class="muted">Profile: ${m.profile}</div></div>`).join('') : '<div class="muted">No medications</div>');
}
function addMedicationToProfile(){ const profile = $('medProfileSelect').value; const name = $('medName').value.trim(); const dosage = $('medDosage').value.trim(); if(!profile) return alert('Create/select a profile first'); if(!name) return alert('Enter medicine name'); addForPatient('meds', session.patientId, {profile, name, dosage}); renderMedicationsView(); }

// Prescriptions
function renderPrescriptionsView(){
  const el = $('view-prescriptions'); el.innerHTML = '<h3>Prescriptions</h3>';
  const profiles = queryForPatient('profiles', session.patientId);
  const profileOptions = profiles.length ? profiles.map(p=>`<option value="${p.name}">${p.name}</option>`).join('') : '<option value="">(no profiles)</option>';
  el.innerHTML += `<label>Profile: <select id="presProfileSelect">${profileOptions}</select></label>`;
  el.innerHTML += `<label>Notes / filename: <input id="presText" /></label><button onclick="addPrescriptionForProfile()">Add Prescription</button>`;
  const pres = queryForPatient('prescriptions', session.patientId);
  el.innerHTML += '<h4>Prescriptions</h4>' + (pres.length ? pres.map(p=>`<div class="list-item">${p.text} <div class="muted">Profile: ${p.profile} • ${p._ts}</div></div>`).join('') : '<div class="muted">No prescriptions</div>');
}
function addPrescriptionForProfile(){ const profile = $('presProfileSelect').value; const text = $('presText').value.trim(); if(!profile) return alert('Select a profile'); if(!text) return alert('Enter prescription text'); addForPatient('prescriptions', session.patientId, {profile, text}); renderPrescriptionsView(); }

// Tests
function renderTestsView(){
  const el = $('view-tests'); el.innerHTML = '<h3>Tests & Results</h3>';
  const profiles = queryForPatient('profiles', session.patientId);
  const profileOptions = profiles.length ? profiles.map(p=>`<option value="${p.name}">${p.name}</option>`).join('') : '<option value="">(no profiles)</option>';
  el.innerHTML += `<label>Profile: <select id="testProfileSelect">${profileOptions}</select></label>`;
  el.innerHTML += `<label>Test name: <input id="testName" /></label><label>Result/notes: <input id="testResult" /></label><button onclick="addTestForProfile()">Add Test Result</button>`;
  const tests = queryForPatient('tests', session.patientId);
  el.innerHTML += '<h4>Tests</h4>' + (tests.length ? tests.map(t=>`<div class="list-item"><b>${t.name}</b> — ${t.result || '-'} <div class="muted">Profile: ${t.profile} • ${t._ts}</div></div>`).join('') : '<div class="muted">No tests</div>');
}
function addTestForProfile(){ const profile = $('testProfileSelect').value; const name = $('testName').value.trim(); const result = $('testResult').value.trim(); if(!profile) return alert('Select a profile'); if(!name) return alert('Enter test name'); addForPatient('tests', session.patientId, {profile, name, result}); renderTestsView(); }

// Issues
function renderIssuesView(){ const el = $('view-issues'); el.innerHTML = '<h3>Latest / Present Issues</h3>'; el.innerHTML += `<label>Issue description: <input id="issueText" /></label><button onclick="addIssueForPatient()">Add Issue</button>`; const issues = queryForPatient('issues', session.patientId); el.innerHTML += '<h4>Issue history</h4>' + (issues.length ? issues.map(i=>`<div class="list-item">${i.issue} <div class="muted">${i._ts}</div></div>`).join('') : '<div class="muted">No issues</div>'); }
function addIssueForPatient(){ const txt = $('issueText').value.trim(); if(!txt) return alert('Enter issue'); addForPatient('issues', session.patientId, {issue: txt}); renderIssuesView(); }

// Appointments
function renderAppointmentsView(){ const el = $('view-appointments'); el.innerHTML = '<h3>Appointments & Reminders</h3>'; el.innerHTML += `<label>Date: <input id="apptDate" type="date" /></label><label>Reason: <input id="apptReason" /></label><button onclick="addAppointmentForPatient()">Save Appointment</button>`; const appts = queryForPatient('appointments', session.patientId); el.innerHTML += '<h4>Saved</h4>' + (appts.length ? appts.map(a=>`<div class="list-item">${a.date} — ${a.reason} <div class="muted">${a._ts}</div></div>`).join('') : '<div class="muted">No appointments</div>'); }
function addAppointmentForPatient(){ const date = $('apptDate').value; const reason = $('apptReason').value.trim(); if(!date) return alert('Choose date'); addForPatient('appointments', session.patientId, {date, reason}); renderAppointmentsView(); }

// Mood
function renderMoodView(){ const el = $('view-mood'); el.innerHTML = '<h3>Mood Tracker</h3>'; el.innerHTML += `<div><button class="nav-btn" onclick="addMood('😊')">😊</button><button class="nav-btn" onclick="addMood('😐')">😐</button><button class="nav-btn" onclick="addMood('😔')">😔</button></div>`; const moods = queryForPatient('moods', session.patientId); el.innerHTML += '<h4>History</h4>' + (moods.length ? moods.map(m=>`<div class="list-item">${m.mood} <div class="muted">${m._ts}</div></div>`).join('') : '<div class="muted">No mood entries</div>'); }
function addMood(mood){ addForPatient('moods', session.patientId, {mood}); renderMoodView(); }

// Consult (patient)
function renderConsultView(){ const el = $('view-consult'); el.innerHTML = '<h3>Consult Doctor</h3>'; el.innerHTML += `<label>Message: <textarea id="consultText"></textarea></label><button onclick="sendConsult()">Send</button>`; const reqs = queryForPatient('consults', session.patientId); el.innerHTML += '<h4>Your Requests</h4>' + (reqs.length ? reqs.map(r=>`<div class="list-item">${r.message} <div class="muted">${r._ts}</div></div>`).join('') : '<div class="muted">No consult requests</div>'); }
function sendConsult(){ const msg = $('consultText').value.trim(); if(!msg) return alert('Enter message'); addForPatient('consults', session.patientId, {message: msg}); renderConsultView(); }

// Patient SOS
function renderSOSPatientView(){ const el = $('view-sos'); el.innerHTML = '<h3>SOS</h3><p>Send emergency alert to hospital and your contacts.</p><button class="big-red" onclick="patientTriggerSOS()">Send SOS</button>'; const sos = queryForPatient('sos', session.patientId); el.innerHTML += '<h4>Your SOS history</h4>' + (sos.length ? sos.map(s=>`<div class="sos-item">${s._ts} • ${s.msg}</div>`).join('') : '<div class="muted">No SOS</div>'); }
function patientTriggerSOS(){ addForPatient('sos', session.patientId, {msg: 'Patient triggered SOS'}); alert('SOS logged. Hospital can view it.'); renderSOS(); renderSOSPatientView(); }

// Hospital - Search patient
function renderHospitalSearchView(){ const el = $('view-search'); el.innerHTML = '<h3>Search Patient</h3>'; el.innerHTML += `<label>Patient ID: <input id="searchPid" /></label><button onclick="hospitalSearch()">Search</button><div id="hospitalSearchResults"></div>`; }
function hospitalSearch(){ const pid = $('searchPid').value.trim(); if(!pid) return alert('Enter Patient ID'); const p = loadAll('patients').find(x=>x.patientId===pid); if(!p) return $('hospitalSearchResults').innerHTML = '<div class="muted">Patient not found</div>'; let out = `<h4>${p.name} — ${p.patientId}</h4>`; const profiles = queryForPatient('profiles', pid); out += '<h5>Profiles</h5>' + (profiles.length ? profiles.map(pr=>`<div class="list-item">${pr.name} <div class="muted">${pr._ts}</div></div>`).join('') : '<div class="muted">No profiles</div>'); const meds = queryForPatient('meds', pid); out += '<h5>Medications</h5>' + (meds.length ? meds.map(m=>`<div class="list-item">${m.name} — ${m.dosage} <div class="muted">Profile: ${m.profile}</div></div>`).join('') : '<div class="muted">No meds</div>'); const pres = queryForPatient('prescriptions', pid); out += '<h5>Prescriptions</h5>' + (pres.length ? pres.map(pr=>`<div class="list-item">${pr.text} <div class="muted">Profile: ${pr.profile} • ${pr._ts}</div></div>`).join('') : '<div class="muted">No prescriptions</div>'); const tests = queryForPatient('tests', pid); out += '<h5>Tests</h5>' + (tests.length ? tests.map(t=>`<div class="list-item">${t.name} — ${t.result || '-'} <div class="muted">Profile: ${t.profile}</div></div>`).join('') : '<div class="muted">No tests</div>'); const issues = queryForPatient('issues', pid); out += '<h5>Issues</h5>' + (issues.length ? issues.map(i=>`<div class="list-item">${i.issue} <div class="muted">${i._ts}</div></div>`).join('') : '<div class="muted">No issues</div>'); const appts = queryForPatient('appointments', pid); out += '<h5>Appointments</h5>' + (appts.length ? appts.map(a=>`<div class="list-item">${a.date} — ${a.reason} <div class="muted">${a._ts}</div></div>`).join('') : '<div class="muted">No appointments</div>'); const contacts = queryForPatient('contacts', pid); out += '<h5>Contacts</h5>' + (contacts.length ? contacts.map(c=>`<div class="list-item">${c.name} — ${c.phone}</div>`).join('') : '<div class="muted">No contacts</div>'); const visits = queryForPatient('visits', pid); out += '<h5>Visits & Admits</h5>' + (visits.length ? visits.map(v=>`<div class="list-item">${v.type} — ${v.reason} <div class="muted">${v._ts}</div></div>`).join('') : '<div class="muted">No visits</div>'); $('hospitalSearchResults').innerHTML = out; }

// Hospital - upload prescription/test and visits
function renderUploadPrescriptionView(){ const el = $('view-uploadPres'); el.innerHTML = '<h3>Upload Prescription (Authority)</h3>'; el.innerHTML += `<label>Patient ID: <input id="uploadPresPid" /></label><label>Profile (disease): <input id="uploadPresProfile" /></label><label>Notes/filename: <input id="uploadPresText" /></label><button onclick="hospitalUploadPrescription()">Upload</button>`; }
function hospitalUploadPrescription(){ const pid = $('uploadPresPid').value.trim(); const profile = $('uploadPresProfile').value.trim(); const txt = $('uploadPresText').value.trim(); if(!pid||!txt) return alert('Enter patient ID and prescription'); addForPatient('prescriptions', pid, {profile, text: txt, byAuthority: true}); alert('Prescription uploaded'); }

function renderUploadTestView(){ const el = $('view-uploadTest'); el.innerHTML = '<h3>Upload Test Result (Authority)</h3>'; el.innerHTML += `<label>Patient ID: <input id="uploadTestPid" /></label><label>Profile: <input id="uploadTestProfile" /></label><label>Test name: <input id="uploadTestName" /></label><label>Result/notes: <input id="uploadTestResult" /></label><button onclick="hospitalUploadTest()">Upload</button>`; }
function hospitalUploadTest(){ const pid = $('uploadTestPid').value.trim(); const profile = $('uploadTestProfile').value.trim(); const name = $('uploadTestName').value.trim(); const result = $('uploadTestResult').value.trim(); if(!pid||!name) return alert('Enter patient ID and test name'); addForPatient('tests', pid, {profile, name, result, byAuthority: true}); alert('Test uploaded'); }

function renderVisitsView(){ const el = $('view-visits'); el.innerHTML = '<h3>Visits & Admissions (Authority)</h3>'; el.innerHTML += `<label>Patient ID: <input id="visitPid" /></label><label>Type: <select id="visitType"><option>Visit</option><option>Admit</option></select></label><label>Reason: <input id="visitReason" /></label><button onclick="addVisit()">Add</button>`; const visits = loadAll('visits'); el.innerHTML += '<h4>All visits</h4>' + (visits.length ? visits.map(v=>`<div class="list-item">${v.patientId} — ${v.type} — ${v.reason} <div class="muted">${v._ts}</div></div>`).join('') : '<div class="muted">No visits</div>'); }
function addVisit(){ const pid = $('visitPid').value.trim(); const type = $('visitType').value; const reason = $('visitReason').value.trim(); if(!pid||!reason) return alert('Enter patient ID and reason'); addForPatient('visits', pid, {type, reason, byAuthority: true}); alert('Visit recorded'); renderVisitsView(); }

// Consult list for authority
function renderConsultListView(){ const el = $('view-consultList'); el.innerHTML = '<h3>Consult Requests</h3>'; const all = loadAll('consults'); el.innerHTML += (all.length ? all.map(c=>`<div class="list-item"><b>${c.patientId}</b> — ${c.message} <div class="muted">${c._ts}</div><div><button onclick="replyConsult('${c.patientId}','${c._ts}')">Reply</button></div></div>`).join('') : '<div class="muted">No consult requests</div>'); }
function replyConsult(pid, ts){ const reply = prompt('Enter reply for ' + pid); if(!reply) return; addForPatient('consultReplies', pid, {reply, repliedAt: new Date().toLocaleString()}); alert('Reply saved'); }

// SOS view for authority
function renderSOS(){ const el = $('view-soslog'); const sos = loadAll('sos'); if(el) el.innerHTML = '<h3>SOS Requests (All)</h3>' + (sos.length ? sos.map(s=>`<div class="sos-item"><b>${s.patientId}</b> — ${s._ts} • ${s.msg}</div>`).join('') : '<div class="muted">No SOS</div>'); }

// helper re-definitions used in places
function loadAll(key){ try{ return JSON.parse(localStorage.getItem(key) || '[]'); }catch(e){ return []; } }
function queryForPatient(kind, pid){ return loadAll(kind).filter(x=>x.patientId === pid); }
function addForPatient(kind, pid, obj){ obj.patientId = pid; obj._ts = new Date().toLocaleString(); const arr = loadAll(kind); arr.push(obj); saveAll(kind, arr); }
function saveAll(key, arr){ localStorage.setItem(key, JSON.stringify(arr)); }

// ensure patients list exists
if(!localStorage.getItem('patients')) localStorage.setItem('patients', JSON.stringify([]));

// End of script
