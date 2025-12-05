#!/usr/bin/env node
// Simple test uploader for SehatSphere backend
// Usage:
//   node test-upload.js [path/to/file] [API_BASE_URL] [patientId]
// Examples:
//   node test-upload.js test-file.txt http://localhost:3001/api
//   node test-upload.js /tmp/photo.jpg

const fs = require('fs');
const path = require('path');

const fileArg = process.argv[2] || path.join(__dirname, 'test-file.txt');
const apiBase = (process.argv[3] || 'http://localhost:3001/api').replace(/\/$/, '');
const patientId = process.argv[4] || process.env.PATIENT_ID;
const endpoint = `${apiBase}/files/upload`;

async function main() {
  try {
    if (!fs.existsSync(fileArg)) {
      console.error('File not found:', fileArg);
      process.exit(1);
    }

    const filename = path.basename(fileArg);
    const buffer = fs.readFileSync(fileArg);

    // Use Web/FormData + Blob (available in Node 18+ / 20+)
    const form = new FormData();
    const blob = new Blob([buffer]);
    form.append('file', blob, filename);
    if (patientId) form.append('patientId', patientId);

    console.log('Uploading', fileArg, 'to', endpoint);

    const res = await fetch(endpoint, { method: 'POST', body: form });
    const status = res.status;
    let body;
    try {
      body = await res.json();
    } catch (e) {
      body = await res.text();
    }

    console.log('Status:', status);
    console.log('Response:', body);
  } catch (err) {
    console.error('Upload failed:', err);
    process.exit(1);
  }
}

main();
