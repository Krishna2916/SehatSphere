const express = require('express');
const router = express.Router();

// Simple placeholder AI endpoint - replace with real AI / LLM integration later
router.post('/analyzeSymptoms', async (req, res) => {
  try {
    const { symptom, patientId } = req.body;
    if (!symptom) return res.status(400).json({ message: 'symptom required' });

    // Very small rule-based placeholder
    const text = symptom.toLowerCase();
    let response = '';
    if (text.includes('headache')) {
      response = 'Headache: Could be caused by tension, dehydration, or stress. Rest, hydrate, and take paracetamol if needed. See a doctor if severe.';
    } else if (text.includes('fever')) {
      response = 'Fever: Usually a sign of infection. Rest and fluids. If high or persistent, get checked by a doctor.';
    } else {
      response = 'General note: Monitor symptoms for 24-48 hours, rest and hydrate, contact your doctor if symptoms worsen.';
    }

    // Return structured response
    res.json({ ok: true, data: { symptom, response, patientId } });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

module.exports = router;
