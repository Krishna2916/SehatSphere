// SehatSphere MVP - Healthcare App with AI Assistance
// Updated: 2025 - Elder-Friendly Interface

const $ = id => document.getElementById(id);
let session = { role: null, name: null, patientId: null };

// Backend API base - change to your deployed backend when ready
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3001/api';
// Try backend by default; frontend falls back to localStorage if backend fails
let useBackend = true;

// Upload a single file to backend S3 endpoint. Returns file metadata or null on failure.
async function uploadFileToServer(file, type = 'document') {
  if (!file) return null;
  try {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('patientId', session.patientId || 'guest');
    fd.append('type', type);

    // Use local /api/upload route for MVP (no S3)
    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: fd
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    // support both old S3 response (data.file) and new local upload response
    if (data.file) return data.file;
    if (data.success && data.path) return { url: data.path, filename: data.fileName, originalName: data.originalName };
    return null;
  } catch (e) {
    console.warn('File upload failed, falling back to local storage', e.message);
    return null;
  }
}

// ===== UTILITY FUNCTIONS =====

// Generate unique Health ID
function genHealthId(name) {
  const base = (name || 'user').replace(/\s+/g, '').toUpperCase().slice(0, 6);
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return 'MED' + base + rand.toString().slice(0, 5);
}

// LocalStorage helpers
function loadAll(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    console.error('Parse error', key, e);
    return [];
  }
}

function saveAll(key, arr) {
  localStorage.setItem(key, JSON.stringify(arr));
}

function ensureKey(key) {
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify([]));
  }
}

function addRecord(kind, obj) {
  const arr = loadAll(kind);
  arr.push(obj);
  saveAll(kind, arr);
}

function addForPatient(kind, pid, obj) {
  obj.patientId = pid;
  obj._ts = new Date().toLocaleString();
  addRecord(kind, obj);
}

function queryForPatient(kind, pid) {
  return loadAll(kind).filter(x => x.patientId === pid);
}

// Initialize localStorage keys
['patients', 'profiles', 'meds', 'prescriptions', 'tests', 'issues', 'appointments', 'moods', 'consults', 'consultReplies', 'contacts', 'visits', 'sos', 'aiQueries', 'fileUploads'].forEach(ensureKey);

// Hide splash screen
window.onload = () => {
  setTimeout(() => {
    const s = $('splash');
    if (s) s.style.display = 'none';
  }, 600);
  // After UI ready, check backend health
  checkBackendHealth();
};

// Check backend health and set useBackend flag accordingly
async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    if (res.ok) {
      const j = await res.json();
      console.log('Backend healthy:', j);
      useBackend = true;
    } else {
      console.warn('Backend health check failed, using local fallback');
      useBackend = false;
    }
  } catch (e) {
    console.warn('Backend unreachable, using local fallback', e.message);
    useBackend = false;
  }
}

// ===== LOGIN FLOW =====

$('loginBtn').addEventListener('click', () => {
  const name = $('nameInput').value.trim() || 'Anonymous';
  const role = $('roleSelect').value;
  let pid = $('patientIdInput').value.trim();

  if (!pid) {
    // Generate unique Health ID
    do {
      pid = genHealthId(name);
    } while (loadAll('patients').find(p => p.patientId === pid));
  }

  // Create patient entry if new
  const patients = loadAll('patients');
  if (!patients.find(p => p.patientId === pid)) {
    patients.push({
      patientId: pid,
      name: name,
      role: role,
      created: new Date().toLocaleString()
    });
    saveAll('patients', patients);
  }

  session = { role, name, patientId: pid };
  setTimeout(afterLogin, 120);
});

function afterLogin() {
  $('loginSection').classList.add('hidden');
  $('dashboard').classList.remove('hidden');
  $('logoutBtn').classList.remove('hidden');

  $('welcome').innerText = `👋 Welcome, ${session.name}`;
  $('healthIdDisplay').innerText = `🆔 Health ID: ${session.patientId}`;

  if (session.role === 'patient' || session.role === 'dementia') {
    // Show patient home dashboard
    $('patientHome').classList.remove('hidden');
    $('authorityHome').classList.add('hidden');
    addPatientMenuButtons($('patientMenu'));
  } else {
    // Show authority dashboard
    $('authorityHome').classList.remove('hidden');
    $('patientHome').classList.add('hidden');
    addAuthorityMenuButtons($('hospitalMenu'));
    renderSOS();
  }
}

// Logout
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'logoutBtn') {
    location.reload();
  }
});

// Toggle expanded menu
function toggleMenu() {
  const menu = $('expandedMenu');
  menu.classList.toggle('hidden');
}

// ===== MENU BUILDERS =====

function addPatientMenuButtons(container) {
  const items = [
    ['profile', '👤 Profile & Contacts'],
    ['profiles', '🗂 Health Profiles'],
    ['medications', '💊 Medications'],
    ['prescriptions', '📋 Prescriptions'],
    ['tests', '🧪 Tests & Results'],
    ['issues', '📝 Current Issues'],
    ['appointments', '⏰ Appointments'],
    ['mood', '🙂 Mood Tracker'],
    ['consult', '🩺 Consult Doctor'],
    ['sos', '🚨 SOS Emergency']
  ];

  container.innerHTML = '';
  items.forEach(it => {
    const b = document.createElement('button');
    b.className = 'nav-btn';
    b.innerText = it[1];
    b.onclick = () => showView(it[0]);
    container.appendChild(b);
  });
}

function addAuthorityMenuButtons(container) {
  const items = [
    ['search', '🔍 Search Patient'],
    ['uploadPres', '📤 Upload Prescription'],
    ['uploadTest', '📤 Upload Test Result'],
    ['visits', '🏥 Visits & Admits'],
    ['consultList', '💬 Consult Requests'],
    ['soslog', '🚑 Emergency Log']
  ];

  container.innerHTML = '';
  items.forEach(it => {
    const b = document.createElement('button');
    b.className = 'nav-btn';
    b.innerText = it[1];
    b.onclick = () => showView(it[0]);
    container.appendChild(b);
  });
}

// ===== VIEW MANAGEMENT (MVP Enhanced) =====

function showView(view) {
  const allViews = [
    // Patient views
    'profile', 'profiles', 'medications', 'prescriptions', 'tests', 'issues', 'appointments', 'mood', 'consult', 'sos',
    // MVP views
    'askAI', 'myReports', 'healthId', 'reminders',
    // Authority views
    'search', 'uploadPres', 'uploadTest', 'visits', 'consultList', 'soslog'
  ];

  const container = $('views');

  // Create view sections if missing
  allViews.forEach(v => {
    if (!document.getElementById('view-' + v)) {
      const s = document.createElement('section');
      s.id = 'view-' + v;
      s.className = 'card hidden';
      container.appendChild(s);
    }
  });

  // Hide all views
  allViews.forEach(v => document.getElementById('view-' + v).classList.add('hidden'));
  document.getElementById('view-' + view).classList.remove('hidden');

  // Call renderer
  try {
    const renderers = {
      // MVP Views
      askAI: renderAskAIView,
      myReports: renderMyReportsView,
      healthId: renderHealthIdView,
      reminders: renderRemindersView,
      // Patient views
      profile: renderProfileView,
      profiles: renderDiseaseProfiles,
      medications: renderMedicationsView,
      prescriptions: renderPrescriptionsView,
      tests: renderTestsView,
      issues: renderIssuesView,
      appointments: renderAppointmentsView,
      mood: renderMoodView,
      consult: renderConsultView,
      sos: renderSOSPatientView,
      // Authority views
      search: renderHospitalSearchView,
      uploadPres: renderUploadPrescriptionView,
      uploadTest: renderUploadTestView,
      visits: renderVisitsView,
      consultList: renderConsultListView,
      soslog: renderSOS
    };

    if (renderers[view]) {
      renderers[view]();
    }
  } catch (e) {
    console.error('Renderer error for', view, e);
  }
}

// ===== MVP VIEWS (NEW) =====

// Ask AI About Health
function renderAskAIView() {
  const el = $('view-askAI');
  el.innerHTML = `
    <h3>🤖 Ask AI About My Health</h3>
    <p class="subtitle-text">Describe your symptoms or health concern. Our AI will explain in simple language.</p>
    
    <div class="form-group">
      <label for="symptomInput">Your Symptoms or Health Concern:</label>
      <textarea id="symptomInput" placeholder="e.g., I have a headache and feel dizzy since morning"></textarea>
    </div>

    <div style="margin-bottom: 16px;">
      <p style="font-weight: 600; margin-bottom: 8px;">📸 Attach Medical Documents (optional)</p>
      <label style="display: block; margin-bottom: 8px;">
        <span>📋 Prescription Photo</span>
          <input type="file" id="filePresc" accept="image/*,.pdf,.doc,.docx" style="display: block; margin-top: 4px;" />
          <div id="preview-filePresc" class="muted" style="margin-top:8px"></div>
      </label>
      <label style="display: block; margin-bottom: 8px;">
        <span>💊 Medicine Strip Photo</span>
          <input type="file" id="fileMeds" accept="image/*,.pdf,.doc,.docx" style="display: block; margin-top: 4px;" />
          <div id="preview-fileMeds" class="muted" style="margin-top:8px"></div>
      </label>
      <label style="display: block; margin-bottom: 8px;">
        <span>🧪 Lab Report Photo</span>
          <input type="file" id="fileReport" accept="image/*,.pdf,.doc,.docx" style="display: block; margin-top: 4px;" />
          <div id="preview-fileReport" class="muted" style="margin-top:8px"></div>
      </label>
    </div>

    <button class="btn-primary" onclick="submitHealthQuery()">Get Explanation</button>

    <div id="aiResponse" class="hidden" style="margin-top: 20px; padding: 16px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid var(--primary-blue);">
      <h4>📌 AI Explanation:</h4>
      <p id="responseText"></p>
    </div>

    <h4 style="margin-top: 24px;">Your Query History</h4>
    <div id="queryHistory"></div>
  `;

  // Load and display query history
  const queries = queryForPatient('aiQueries', session.patientId);
  if (queries.length > 0) {
    $('queryHistory').innerHTML = queries
      .reverse()
      .map(q => `<div class="list-item"><strong>Q:</strong> ${q.symptom}<br/><strong>Response:</strong> ${q.response.substring(0, 100)}...<br/><span class="muted">${q._ts}</span></div>`)
      .join('');
  } else {
    $('queryHistory').innerHTML = '<div class="muted">No queries yet. Ask a question to get started!</div>';
  }

  // Client-side previews for selected files (show thumbnail for images, filename for other files)
  function setupFilePreview(inputId) {
    const inp = document.getElementById(inputId);
    const preview = document.getElementById('preview-' + inputId);
    if (!inp || !preview) return;
    inp.addEventListener('change', (e) => {
      preview.innerHTML = '';
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const isImage = /^image\//.test(f.type) || /\.(jpg|jpeg|png|gif)$/i.test(f.name);
      if (isImage) {
        const url = URL.createObjectURL(f);
        const img = document.createElement('img');
        img.src = url;
        img.alt = f.name;
        img.style.maxWidth = '160px';
        img.style.borderRadius = '6px';
        img.style.display = 'block';
        preview.appendChild(img);
        img.onload = () => URL.revokeObjectURL(url);
      } else {
        const el = document.createElement('div');
        el.innerText = f.name;
        preview.appendChild(el);
      }
    });
  }

  ['filePresc','fileMeds','fileReport'].forEach(id => setupFilePreview(id));
}

async function submitHealthQuery() {
  const symptom = $('symptomInput').value.trim();
  if (!symptom) {
    alert('Please describe your symptoms');
    return;
  }

  // Try to upload any selected files first (non-blocking if upload fails)
  const presFile = document.getElementById('filePresc')?.files?.[0] || null;
  const medsFile = document.getElementById('fileMeds')?.files?.[0] || null;
  const reportFile = document.getElementById('fileReport')?.files?.[0] || null;

  let uploaded = [];
  if (useBackend) {
    try {
      if (presFile) {
        const f = await uploadFileToServer(presFile, 'prescription');
        if (f) uploaded.push(f);
      }
      if (medsFile) {
        const f = await uploadFileToServer(medsFile, 'meds');
        if (f) uploaded.push(f);
      }
      if (reportFile) {
        const f = await uploadFileToServer(reportFile, 'report');
        if (f) uploaded.push(f);
      }
    } catch (e) {
      console.warn('One or more uploads failed', e.message);
    }
  }

  // If uploads failed and files were selected, notify the user (no local fallback for MVP)
  if (uploaded.length === 0 && (presFile || medsFile || reportFile)) {
    alert('One or more file uploads failed. Please try again.');
  }

  // Call backend AI endpoint if available, otherwise fallback to placeholder
  let responseText = null;
  if (useBackend) {
    try {
      const resp = await fetch(`${API_BASE_URL}/ai/analyzeSymptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptom, patientId: session.patientId })
      });
      if (resp.ok) {
        const json = await resp.json();
        responseText = json.data?.response || json.response || null;
      } else {
        console.warn('AI API returned error, falling back to local response');
        responseText = null;
      }
    } catch (e) {
      console.warn('AI API call failed', e.message);
      responseText = null;
    }
  }

  if (!responseText) {
    responseText = getPlaceholderAIResponse(symptom);
  }

  // Store query + uploaded files metadata
  addForPatient('aiQueries', session.patientId, {
    symptom: symptom,
    response: responseText,
    uploaded: uploaded
  });

  // Show response
  $('aiResponse').classList.remove('hidden');
  $('responseText').innerHTML = responseText;

  // Render uploaded file previews (images show as thumbnails, others as links)
  function isImageFilename(name) {
    if (!name) return false;
    return /\.(jpg|jpeg|png|gif)$/i.test(name);
  }

  const previewsElId = 'uploadedPreviews';
  // remove existing previews if any
  let existing = document.getElementById(previewsElId);
  if (existing) existing.remove();
  const previewsWrap = document.createElement('div');
  previewsWrap.id = previewsElId;
  previewsWrap.style.marginTop = '12px';
  if (uploaded && uploaded.length) {
    uploaded.forEach(u => {
      // u might be different shapes depending on backend response
      const url = u.url || u.path || (u.file && (u.file.url || u.file.location)) || null;
      const name = u.filename || u.originalName || (u.file && (u.file.filename || u.file.originalname)) || u.type || 'file';
      if (url && isImageFilename(name)) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = name;
        img.style.maxWidth = '160px';
        img.style.display = 'inline-block';
        img.style.marginRight = '8px';
        img.style.borderRadius = '6px';
        previewsWrap.appendChild(img);
      } else if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.innerText = `Open ${name}`;
        a.style.display = 'block';
        a.style.marginTop = '6px';
        previewsWrap.appendChild(a);
      }
    });
    $('aiResponse').appendChild(previewsWrap);
  }

  // Clear input and files
  $('symptomInput').value = '';
  if (document.getElementById('filePresc')) document.getElementById('filePresc').value = '';
  if (document.getElementById('fileMeds')) document.getElementById('fileMeds').value = '';
  if (document.getElementById('fileReport')) document.getElementById('fileReport').value = '';

  // Refresh history
  setTimeout(() => renderAskAIView(), 500);
}

function getPlaceholderAIResponse(symptom) {
  // Placeholder responses - to be replaced with real AI API
  const responses = {
    headache: '💡 <strong>Headache Explanation:</strong><br/>Headaches can be caused by stress, dehydration, or tension. <br/>✅ <strong>What to do:</strong> Drink water, rest in a cool dark room, take a painkiller if needed, and see a doctor if it persists for more than 2 days.',
    fever: '💡 <strong>Fever Explanation:</strong><br/>Fever is your body\'s way of fighting infection. Most fevers are caused by viral infections (like cold or flu).<br/>✅ <strong>What to do:</strong> Rest, drink fluids, take fever medicine (paracetamol), wear light clothing. See a doctor if fever is >101°F or lasts >3 days.',
    default: '💡 <strong>Health Note:</strong><br/>Your concern has been noted. Based on your description, we recommend:<br/>✅ Monitor your symptoms for 24-48 hours<br/>✅ Stay hydrated and get adequate rest<br/>✅ Contact your doctor if symptoms worsen or persist<br/>⚠️ Seek immediate medical care if you experience chest pain, difficulty breathing, or severe symptoms.'
  };

  const key = Object.keys(responses).find(k => symptom.toLowerCase().includes(k));
  return responses[key] || responses.default;
}

// Helper: read a File into a data URL (for local fallback storage)
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

// My Reports & Prescriptions
function renderMyReportsView() {
  const el = $('view-myReports');
  el.innerHTML = '<h3>📋 My Reports & Prescriptions</h3>';

  const prescriptions = queryForPatient('prescriptions', session.patientId);
  const tests = queryForPatient('tests', session.patientId);
  const uploads = queryForPatient('fileUploads', session.patientId);

  el.innerHTML += '<h4>Prescriptions</h4>';
  if (prescriptions.length > 0) {
    el.innerHTML += prescriptions.map(p => `<div class="list-item"><strong>📄 Prescription</strong><br/>${p.text}<br/><span class="muted">${p._ts}</span></div>`).join('');
  } else {
    el.innerHTML += '<div class="muted">No prescriptions yet</div>';
  }

  el.innerHTML += '<h4>Test Results</h4>';
  if (tests.length > 0) {
    el.innerHTML += tests.map(t => `<div class="list-item"><strong>🧪 ${t.name}</strong><br/>Result: ${t.result || '-'}<br/><span class="muted">${t._ts}</span></div>`).join('');
  } else {
    el.innerHTML += '<div class="muted">No test results yet</div>';
  }

  el.innerHTML += '<h4>Uploaded Documents</h4>';
  if (uploads.length > 0) {
    // Add a Sync button to attempt uploading local files to server if backend is available
    const localOnly = uploads.filter(u => !u.url && u.dataUrl);
    if (localOnly.length > 0) {
      el.innerHTML += `<div style="margin-bottom:12px;"><button class="btn-primary" onclick="syncLocalUploads()">🔁 Sync Local Uploads to Server</button><small class="muted" style="display:block;margin-top:6px;">Uploads saved locally will be uploaded to server when available.</small></div>`;
    }
    el.innerHTML += uploads.map(u => {
      // if uploaded via backend, `u.url` exists; if saved locally, `u.dataUrl` exists
      const preview = u.url ? `<a href="${u.url}" target="_blank">Open file</a>` : (u.dataUrl ? `<img src="${u.dataUrl}" alt="${u.filename}" style="max-width:160px;display:block;margin-top:8px;border-radius:6px;" />` : '');
      const ts = u._ts || (u.uploadedAt ? new Date(u.uploadedAt).toLocaleString() : '');
      return `<div class="list-item"><strong>📸 ${u.type || u.filename}</strong><br/>${u.filename || u.type}<br/>${preview}<br/><span class="muted">${ts}</span></div>`;
    }).join('');
  } else {
    el.innerHTML += '<div class="muted">No documents uploaded yet</div>';
  }
}

// Attempt to upload locally-saved files (dataUrl) to the backend when it becomes available
async function syncLocalUploads() {
  const uploads = loadAll('fileUploads');
  const localOnly = uploads.filter(u => !u.url && u.dataUrl && u.patientId === session.patientId);
  if (!localOnly.length) return alert('No local uploads to sync');
  if (!useBackend) {
    alert('Backend not available. Please try again later.');
    return;
  }

  let successCount = 0;
  for (const item of localOnly) {
    try {
      // Convert dataUrl back to File
      const file = dataURLtoFile(item.dataUrl, item.filename || 'upload.png');
      const uploaded = await uploadFileToServer(file, item.type || 'document');
      if (uploaded) {
        // remove old item and add server metadata
        const all = loadAll('fileUploads').filter(x => !(x.dataUrl === item.dataUrl && x.patientId === item.patientId));
        all.push({ patientId: item.patientId, filename: item.filename, type: item.type, url: uploaded.url, key: uploaded.key, _ts: new Date().toLocaleString() });
        saveAll('fileUploads', all);
        successCount++;
      }
    } catch (e) {
      console.warn('Sync failed for item', item.filename, e.message);
    }
  }
  alert(`Sync finished. ${successCount} files uploaded.`);
  renderMyReportsView();
}

// Convert dataURL to File object
function dataURLtoFile(dataurl, filename) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){ u8arr[n] = bstr.charCodeAt(n); }
  return new File([u8arr], filename, {type:mime});
}

// My Health ID & Profile
function renderHealthIdView() {
  const el = $('view-healthId');
  const patient = loadAll('patients').find(p => p.patientId === session.patientId);

  el.innerHTML = `
    <h3>🆔 My Health ID & Profile</h3>
    
    <div style="background: linear-gradient(135deg, #e3f2fd, #fff); padding: 24px; border-radius: 12px; border: 2px solid var(--primary-blue); text-align: center; margin-bottom: 24px;">
      <p style="color: var(--muted-gray); margin-bottom: 8px;">YOUR UNIQUE HEALTH ID</p>
      <h2 style="font-size: 32px; color: var(--primary-blue); font-weight: 700; margin: 0; font-family: monospace;">${session.patientId}</h2>
      <p style="color: #666; margin-top: 12px; font-size: 13px;">Share this ID with hospitals and doctors to let them access your health records</p>
      <button class="btn-primary" onclick="copyHealthId()" style="margin-top: 12px; width: auto; padding: 8px 16px;">📋 Copy ID</button>
    </div>

    <div class="card" style="background: #fff3e0; border-left: 4px solid #ff9800;">
      <h4>📌 How to Share Your Health ID:</h4>
      <ol style="margin-left: 20px; color: #333;">
        <li>Give this ID to your hospital or doctor</li>
        <li>They will enter it in their system</li>
        <li>They can then view your prescriptions, test results, and medical history</li>
      </ol>
    </div>

    <h4>Your Profile Information</h4>
    <div class="list-item">
      <strong>Name:</strong> ${patient?.name || 'N/A'}<br/>
      <strong>Role:</strong> ${session.role}<br/>
      <strong>Created:</strong> ${patient?.created || 'N/A'}
    </div>

    <h4>Emergency Contacts</h4>
    <div id="contactsList"></div>
  `;

  const contacts = queryForPatient('contacts', session.patientId);
  const contactsHtml = contacts.length
    ? contacts.map(c => `<div class="list-item">${c.name} — ${c.phone}</div>`).join('')
    : '<div class="muted">No emergency contacts added. Add one in your profile.</div>';

  $('contactsList').innerHTML = contactsHtml;
}

function copyHealthId() {
  navigator.clipboard.writeText(session.patientId);
  alert('Health ID copied to clipboard! 📋');
}

// Reminders
function renderRemindersView() {
  const el = $('view-reminders');
  el.innerHTML = '<h3>🔔 Reminders</h3>';
  el.innerHTML += '<p class="subtitle-text">Your medicines and appointments</p>';

  const meds = queryForPatient('meds', session.patientId);
  const appts = queryForPatient('appointments', session.patientId);

  el.innerHTML += '<h4>💊 Medicine Reminders</h4>';
  if (meds.length > 0) {
    el.innerHTML += meds.map(m => `
      <div class="list-item">
        <strong>${m.name}</strong> — ${m.dosage}<br/>
        <span class="muted">${m.profile || 'General'}</span>
      </div>
    `).join('');
  } else {
    el.innerHTML += '<div class="muted">No medicines added yet</div>';
  }

  el.innerHTML += '<h4>⏰ Upcoming Appointments</h4>';
  if (appts.length > 0) {
    el.innerHTML += appts.map(a => `
      <div class="list-item">
        <strong>📅 ${a.date}</strong><br/>
        ${a.reason}
      </div>
    `).join('');
  } else {
    el.innerHTML += '<div class="muted">No appointments scheduled</div>';
  }
}

// ===== ORIGINAL PATIENT VIEWS (Modified slightly) =====

function renderProfileView() {
  const el = $('view-profile');
  const patient = loadAll('patients').find(p => p.patientId === session.patientId);
  el.innerHTML = '<h3>👤 Profile & Contacts</h3>';
  el.innerHTML += `<div class="list-item"><strong>Name:</strong> ${patient ? patient.name : session.name}</div>`;
  el.innerHTML += `<div class="form-group"><label for="ecName">Emergency Contact Name:</label><input id="ecName" type="text" /></div>`;
  el.innerHTML += `<div class="form-group"><label for="ecPhone">Phone Number:</label><input id="ecPhone" type="tel" /></div>`;
  el.innerHTML += '<button class="btn-primary" onclick="saveEmergencyContact()">Save Contact</button>';
  const contacts = queryForPatient('contacts', session.patientId);
  el.innerHTML += '<h4>Saved Contacts</h4>' + (contacts.length ? contacts.map(c => `<div class="list-item"><strong>${c.name}</strong> — ${c.phone}</div>`).join('') : '<div class="muted">No contacts saved</div>');
}

function saveEmergencyContact() {
  const name = $('ecName').value.trim();
  const phone = $('ecPhone').value.trim();
  if (!name || !phone) {
    alert('Enter contact name and phone');
    return;
  }
  addForPatient('contacts', session.patientId, { name, phone });
  alert('Contact saved!');
  renderProfileView();
}

function renderDiseaseProfiles() {
  const el = $('view-profiles');
  el.innerHTML = '<h3>🗂 Health Profiles</h3>';
  el.innerHTML += `<div class="form-group"><label for="newProfileName">Profile Name:</label><input id="newProfileName" type="text" placeholder="e.g., Diabetes" /></div>`;
  el.innerHTML += '<button class="btn-primary" onclick="addDiseaseProfile()">Add Profile</button>';
  const profiles = queryForPatient('profiles', session.patientId);
  el.innerHTML += '<h4>Your Profiles</h4>' + (profiles.length ? profiles.map(p => `<div class="list-item"><strong>${p.name}</strong></div>`).join('') : '<div class="muted">No profiles</div>');
}

function addDiseaseProfile() {
  const name = $('newProfileName').value.trim();
  if (!name) {
    alert('Enter profile name');
    return;
  }
  addForPatient('profiles', session.patientId, { name });
  alert('Profile created!');
  renderDiseaseProfiles();
}

function renderMedicationsView() {
  const el = $('view-medications');
  el.innerHTML = '<h3>💊 Medications</h3>';
  const profiles = queryForPatient('profiles', session.patientId);
  const profileOptions = profiles.length ? profiles.map(p => `<option value="${p.name}">${p.name}</option>`).join('') : '<option value="">(Create a profile first)</option>';
  el.innerHTML += `<div class="form-group"><label for="medProfileSelect">Health Profile:</label><select id="medProfileSelect">${profileOptions}</select></div>`;
  el.innerHTML += `<div class="form-group"><label for="medName">Medicine Name:</label><input id="medName" type="text" placeholder="e.g., Aspirin" /></div>`;
  el.innerHTML += `<div class="form-group"><label for="medDosage">Dosage:</label><input id="medDosage" type="text" placeholder="e.g., 500mg, twice daily" /></div>`;
  el.innerHTML += '<button class="btn-primary" onclick="addMedicationToProfile()">Add Medication</button>';
  const meds = queryForPatient('meds', session.patientId);
  el.innerHTML += '<h4>Current Medications</h4>' + (meds.length ? meds.map(m => `<div class="list-item"><strong>${m.name}</strong> — ${m.dosage}</div>`).join('') : '<div class="muted">No medications</div>');
}

function addMedicationToProfile() {
  const profile = $('medProfileSelect').value;
  const name = $('medName').value.trim();
  const dosage = $('medDosage').value.trim();
  if (!profile) {
    alert('Select a profile first');
    return;
  }
  if (!name) {
    alert('Enter medicine name');
    return;
  }
  addForPatient('meds', session.patientId, { profile, name, dosage });
  alert('Medication added!');
  renderMedicationsView();
}

function renderPrescriptionsView() {
  const el = $('view-prescriptions');
  el.innerHTML = '<h3>📋 Prescriptions</h3>';
  const profiles = queryForPatient('profiles', session.patientId);
  const profileOptions = profiles.length ? profiles.map(p => `<option value="${p.name}">${p.name}</option>`).join('') : '<option value="">(no profiles)</option>';
  el.innerHTML += `<div class="form-group"><label for="presProfileSelect">Profile:</label><select id="presProfileSelect">${profileOptions}</select></div>`;
  el.innerHTML += `<div class="form-group"><label for="presText">Prescription Notes:</label><textarea id="presText" placeholder="Describe the prescription"></textarea></div>`;
  el.innerHTML += '<button class="btn-primary" onclick="addPrescriptionForProfile()">Add Prescription</button>';
  const pres = queryForPatient('prescriptions', session.patientId);
  el.innerHTML += '<h4>Prescriptions</h4>' + (pres.length ? pres.map(p => `<div class="list-item">${p.text}</div>`).join('') : '<div class="muted">No prescriptions</div>');
}

function addPrescriptionForProfile() {
  const profile = $('presProfileSelect').value;
  const text = $('presText').value.trim();
  if (!profile) {
    alert('Select a profile');
    return;
  }
  if (!text) {
    alert('Enter prescription details');
    return;
  }
  addForPatient('prescriptions', session.patientId, { profile, text });
  alert('Prescription saved!');
  renderPrescriptionsView();
}

function renderTestsView() {
  const el = $('view-tests');
  el.innerHTML = '<h3>🧪 Tests & Results</h3>';
  const profiles = queryForPatient('profiles', session.patientId);
  const profileOptions = profiles.length ? profiles.map(p => `<option value="${p.name}">${p.name}</option>`).join('') : '<option value="">(no profiles)</option>';
  el.innerHTML += `<div class="form-group"><label for="testProfileSelect">Profile:</label><select id="testProfileSelect">${profileOptions}</select></div>`;
  el.innerHTML += `<div class="form-group"><label for="testName">Test Name:</label><input id="testName" type="text" placeholder="e.g., Blood Test" /></div>`;
  el.innerHTML += `<div class="form-group"><label for="testResult">Result/Notes:</label><textarea id="testResult" placeholder="Test results"></textarea></div>`;
  el.innerHTML += '<button class="btn-primary" onclick="addTestForProfile()">Save Test</button>';
  const tests = queryForPatient('tests', session.patientId);
  el.innerHTML += '<h4>Test Records</h4>' + (tests.length ? tests.map(t => `<div class="list-item"><strong>${t.name}</strong><br/>${t.result || '-'}</div>`).join('') : '<div class="muted">No tests</div>');
}

function addTestForProfile() {
  const profile = $('testProfileSelect').value;
  const name = $('testName').value.trim();
  const result = $('testResult').value.trim();
  if (!profile) {
    alert('Select a profile');
    return;
  }
  if (!name) {
    alert('Enter test name');
    return;
  }
  addForPatient('tests', session.patientId, { profile, name, result });
  alert('Test saved!');
  renderTestsView();
}

function renderIssuesView() {
  const el = $('view-issues');
  el.innerHTML = '<h3>📝 Current Issues</h3>';
  el.innerHTML += `<div class="form-group"><label for="issueText">Describe Your Issue:</label><textarea id="issueText" placeholder="Describe current health issue"></textarea></div>`;
  el.innerHTML += '<button class="btn-primary" onclick="addIssueForPatient()">Report Issue</button>';
  const issues = queryForPatient('issues', session.patientId);
  el.innerHTML += '<h4>Issue History</h4>' + (issues.length ? issues.map(i => `<div class="list-item">${i.issue}</div>`).join('') : '<div class="muted">No issues</div>');
}

function addIssueForPatient() {
  const txt = $('issueText').value.trim();
  if (!txt) {
    alert('Describe your issue');
    return;
  }
  addForPatient('issues', session.patientId, { issue: txt });
  alert('Issue reported!');
  renderIssuesView();
}

function renderAppointmentsView() {
  const el = $('view-appointments');
  el.innerHTML = '<h3>⏰ Appointments</h3>';
  el.innerHTML += `<div class="form-group"><label for="apptDate">Date:</label><input id="apptDate" type="date" /></div>`;
  el.innerHTML += `<div class="form-group"><label for="apptReason">Reason:</label><input id="apptReason" type="text" placeholder="Appointment reason" /></div>`;
  el.innerHTML += '<button class="btn-primary" onclick="addAppointmentForPatient()">Schedule</button>';
  const appts = queryForPatient('appointments', session.patientId);
  el.innerHTML += '<h4>Scheduled Appointments</h4>' + (appts.length ? appts.map(a => `<div class="list-item">${a.date} — ${a.reason}</div>`).join('') : '<div class="muted">No appointments</div>');
}

function addAppointmentForPatient() {
  const date = $('apptDate').value;
  const reason = $('apptReason').value.trim();
  if (!date) {
    alert('Select a date');
    return;
  }
  addForPatient('appointments', session.patientId, { date, reason });
  alert('Appointment scheduled!');
  renderAppointmentsView();
}

function renderMoodView() {
  const el = $('view-mood');
  el.innerHTML = '<h3>🙂 Mood Tracker</h3>';
  el.innerHTML += '<p class="subtitle-text">How are you feeling today?</p>';
  el.innerHTML += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px;"><button class="nav-btn" onclick="addMood(\'😊 Great\')">😊 Great</button><button class="nav-btn" onclick="addMood(\'😐 OK\')">😐 OK</button><button class="nav-btn" onclick="addMood(\'😔 Not Good\')">😔 Not Good</button></div>';
  const moods = queryForPatient('moods', session.patientId);
  el.innerHTML += '<h4>Mood History</h4>' + (moods.length ? moods.map(m => `<div class="list-item">${m.mood}</div>`).join('') : '<div class="muted">No entries</div>');
}

function addMood(mood) {
  addForPatient('moods', session.patientId, { mood });
  renderMoodView();
}

function renderConsultView() {
  const el = $('view-consult');
  el.innerHTML = '<h3>🩺 Consult Doctor</h3>';
  el.innerHTML += `<div class="form-group"><label for="consultText">Your Message:</label><textarea id="consultText" placeholder="Describe your health concern"></textarea></div>`;
  el.innerHTML += '<button class="btn-primary" onclick="sendConsult()">Send Request</button>';
  const reqs = queryForPatient('consults', session.patientId);
  el.innerHTML += '<h4>Your Requests</h4>' + (reqs.length ? reqs.map(r => `<div class="list-item">${r.message}</div>`).join('') : '<div class="muted">No requests</div>');
}

function sendConsult() {
  const msg = $('consultText').value.trim();
  if (!msg) {
    alert('Write your message');
    return;
  }
  addForPatient('consults', session.patientId, { message: msg });
  alert('Request sent to doctor!');
  renderConsultView();
}

function renderSOSPatientView() {
  const el = $('view-sos');
  el.innerHTML = '<h3>🚨 Emergency Alert (SOS)</h3>';
  el.innerHTML += '<p class="subtitle-text">Send emergency alert to hospital and your contacts</p>';
  el.innerHTML += '<button class="big-red" style="width: 100%; padding: 16px; font-size: 16px; background: #e53935;" onclick="patientTriggerSOS()">🚑 SEND SOS</button>';
  const sos = queryForPatient('sos', session.patientId);
  el.innerHTML += '<h4>SOS History</h4>' + (sos.length ? sos.map(s => `<div class="sos-item">${s._ts} — SOS Triggered</div>`).join('') : '<div class="muted">No alerts</div>');
}

function patientTriggerSOS() {
  if (confirm('Send emergency alert to hospital and your contacts?')) {
    addForPatient('sos', session.patientId, { msg: 'Patient triggered SOS' });
    alert('🚑 SOS sent! Hospital has been notified.');
    renderSOS();
    renderSOSPatientView();
  }
}

// ===== AUTHORITY VIEWS =====

function renderHospitalSearchView() {
  const el = $('view-search');
  el.innerHTML = '<h3>🔍 Search Patient</h3>';
  el.innerHTML += `<div class="form-group"><label for="searchPid">Patient Health ID:</label><input id="searchPid" type="text" placeholder="e.g., MEDRAVI12345" /></div>`;
  el.innerHTML += '<button class="btn-primary" onclick="hospitalSearch()">Search</button><div id="hospitalSearchResults" style="margin-top: 16px;"></div>';
}

function hospitalSearch() {
  const pid = $('searchPid').value.trim();
  if (!pid) {
    alert('Enter Patient Health ID');
    return;
  }
  const p = loadAll('patients').find(x => x.patientId === pid);
  if (!p) {
    return $('hospitalSearchResults').innerHTML = '<div class="muted">Patient not found</div>';
  }

  let out = `<div class="card"><h4>${p.name}</h4><div class="muted">Health ID: ${p.patientId}</div></div>`;
  const profiles = queryForPatient('profiles', pid);
  out += '<h5>Health Profiles</h5>' + (profiles.length ? profiles.map(pr => `<div class="list-item">${pr.name}</div>`).join('') : '<div class="muted">None</div>');
  const meds = queryForPatient('meds', pid);
  out += '<h5>Current Medications</h5>' + (meds.length ? meds.map(m => `<div class="list-item"><strong>${m.name}</strong> — ${m.dosage}</div>`).join('') : '<div class="muted">None</div>');
  const pres = queryForPatient('prescriptions', pid);
  out += '<h5>Prescriptions</h5>' + (pres.length ? pres.map(pr => `<div class="list-item">${pr.text}</div>`).join('') : '<div class="muted">None</div>');
  const tests = queryForPatient('tests', pid);
  out += '<h5>Test Results</h5>' + (tests.length ? tests.map(t => `<div class="list-item"><strong>${t.name}</strong> — ${t.result || '-'}</div>`).join('') : '<div class="muted">None</div>');
  const contacts = queryForPatient('contacts', pid);
  out += '<h5>Emergency Contacts</h5>' + (contacts.length ? contacts.map(c => `<div class="list-item">${c.name} — ${c.phone}</div>`).join('') : '<div class="muted">None</div>');
  $('hospitalSearchResults').innerHTML = out;
}

// Authority upload views are implemented further down with file picker support.
// The newer implementations handle file selection, upload to /api/upload, and local fallback.

function renderVisitsView() {
  const el = $('view-visits');
  el.innerHTML = '<h3>🏥 Hospital Visits & Admissions</h3>';
  el.innerHTML += `<div class="form-group"><label for="visitPid">Patient Health ID:</label><input id="visitPid" type="text" /></div>`;
  el.innerHTML += `<div class="form-group"><label for="visitType">Type:</label><select id="visitType"><option>Visit</option><option>Admit</option></select></div>`;
  el.innerHTML += `<div class="form-group"><label for="visitReason">Reason:</label><input id="visitReason" type="text" /></div>`;
  el.innerHTML += '<button class="btn-primary" onclick="addVisit()">Record</button>';
  const visits = loadAll('visits');
  el.innerHTML += '<h4>Visit Records</h4>' + (visits.length ? visits.map(v => `<div class="list-item"><strong>${v.patientId}</strong> — ${v.type}<br/>${v.reason}</div>`).join('') : '<div class="muted">No records</div>');
}

function addVisit() {
  const pid = $('visitPid').value.trim();
  const type = $('visitType').value;
  const reason = $('visitReason').value.trim();
  if (!pid || !reason) {
    alert('Enter patient ID and reason');
    return;
  }
  addForPatient('visits', pid, { type, reason, byAuthority: true });
  alert('Visit recorded!');
  renderVisitsView();
}

function renderConsultListView() {
  const el = $('view-consultList');
  el.innerHTML = '<h3>💬 Doctor Consultation Requests</h3>';
  const all = loadAll('consults');
  el.innerHTML += (all.length ? all.map(c => `<div class="list-item"><b>${c.patientId}</b> — ${c.message}<br/><button class="nav-btn" onclick="replyConsult('${c.patientId}')">Reply</button></div>`).join('') : '<div class="muted">No requests</div>');
}

function replyConsult(pid) {
  const reply = prompt('Enter reply for ' + pid);
  if (!reply) return;
  addForPatient('consultReplies', pid, { reply });
  alert('Reply saved!');
}

function renderSOS() {
  const el = $('view-soslog');
  const sos = loadAll('sos');
  if (el) el.innerHTML = '<h3>🚑 Emergency Alerts (SOS Log)</h3>' + (sos.length ? sos.map(s => `<div class="sos-item"><b>${s.patientId}</b> — ${s._ts}</div>`).join('') : '<div class="muted">No alerts</div>');
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
function renderUploadPrescriptionView(){
  const el = $('view-uploadPres');
  el.innerHTML = '<h3>Upload Prescription (Authority)</h3>';
  el.innerHTML += `<label>Patient ID: <input id="uploadPresPid" /></label>`;
  el.innerHTML += `<label>Profile (disease): <input id="uploadPresProfile" /></label>`;
  // file picker - allow PDF, DOC, DOCX only
  el.innerHTML += `<label>Prescription File (PDF / DOC / DOCX): <input id="uploadPresFile" type="file" accept=".pdf,.doc,.docx" /></label>`;
  el.innerHTML += `<div id="uploadPresStatus" class="muted" style="margin-top:8px"></div>`;
  el.innerHTML += `<button onclick="hospitalUploadPrescriptionFile()">Upload File</button>`;
}

// Upload prescription file. Uses /api/upload endpoint. Falls back to local storage on failure.
async function hospitalUploadPrescriptionFile(){
  const pid = $('uploadPresPid').value.trim() || session.patientId || 'unknown';
  const profile = $('uploadPresProfile').value.trim() || '';
  const statusEl = $('uploadPresStatus');
  const fileInput = document.getElementById('uploadPresFile');
  const file = fileInput?.files?.[0];
  if(!file){ statusEl.innerText = 'Please select a file to upload'; return; }

  const fd = new FormData();
  fd.append('file', file);
  fd.append('patientId', pid);
  fd.append('type', 'prescription');
  fd.append('profile', profile);

  try{
    // Use the runtime global set on the page. TODO: update after backend deploy
    const res = await fetch(window.API_BASE_URL + '/upload', { method: 'POST', body: fd });
    if(!res.ok) throw new Error('Upload failed: ' + res.statusText);
    const json = await res.json();
    statusEl.innerText = `Uploaded: ${file.name}`;
    // store returned path/url if provided
    addForPatient('fileUploads', pid, { filename: file.name, url: json.file?.url || json.url || json.path || null, type: 'prescription' });
  } catch(e){
    console.warn('Upload failed', e.message);
    statusEl.innerText = 'Upload failed: ' + (e.message || 'unknown error');
    // No local fallback for MVP
    return;
  }
}

function renderUploadTestView(){
  const el = $('view-uploadTest');
  el.innerHTML = '<h3>Upload Test Result (Authority)</h3>';
  el.innerHTML += `<label>Patient ID: <input id="uploadTestPid" /></label>`;
  el.innerHTML += `<label>Profile: <input id="uploadTestProfile" /></label>`;
  el.innerHTML += `<label>Test name: <input id="uploadTestName" /></label>`;
  // file picker - allow PDF, DOC, DOCX only
  el.innerHTML += `<label>Test Report (PDF / DOC / DOCX): <input id="uploadTestFile" type="file" accept=".pdf,.doc,.docx" /></label>`;
  el.innerHTML += `<div id="uploadTestStatus" class="muted" style="margin-top:8px"></div>`;
  el.innerHTML += `<button onclick="hospitalUploadTestFile()">Upload File</button>`;
}

// Upload test result file to /api/upload. Falls back to local storage on failure.
async function hospitalUploadTestFile(){
  const pid = $('uploadTestPid').value.trim() || session.patientId || 'unknown';
  const profile = $('uploadTestProfile').value.trim() || '';
  const testName = $('uploadTestName').value.trim() || '';
  const statusEl = $('uploadTestStatus');
  const fileInput = document.getElementById('uploadTestFile');
  const file = fileInput?.files?.[0];
  if(!file){ statusEl.innerText = 'Please select a file to upload'; return; }

  const fd = new FormData();
  fd.append('file', file);
  fd.append('patientId', pid);
  fd.append('type', 'test');
  fd.append('profile', profile);
  fd.append('testName', testName);

  try{
    // TODO: Replace localhost with deployed backend URL via config.js when deploying
    // Use local upload route for MVP
    const res = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: fd });
    if(!res.ok) throw new Error('Upload failed: ' + res.statusText);
    const json = await res.json();
    statusEl.innerText = `Uploaded: ${file.name}`;
    addForPatient('fileUploads', pid, { filename: file.name, url: json.file?.url || json.url || json.path || null, type: 'test', name: testName });
  } catch(e){
    console.warn('Upload failed', e.message);
    statusEl.innerText = 'Upload failed: ' + (e.message || 'unknown error');
    // No local fallback for MVP
    return;
  }
}

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
