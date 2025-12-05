const express = require('express');
const router = express.Router();

// AI symptom analyzer - rule-based placeholder (replace with real LLM later)
router.post('/analyzeSymptoms', async (req, res) => {
  try {
    const { symptom, patientId } = req.body;
    if (!symptom) return res.status(400).json({ message: 'symptom required' });

    const text = symptom.toLowerCase();
    let response = '';

    // Comprehensive symptom-based responses
    if (text.includes('chest pain') || text.includes('chest')) {
      response = 'Chest Pain: This can be serious. Seek immediate medical attention (call emergency) if: sharp pain, difficulty breathing, or feeling faint. Minor chest pain could be muscle strain or acid reflux. Get checked by a doctor regardless. Do not ignore this symptom.';
    } else if (text.includes('anxiety') || text.includes('panic') || text.includes('nervous')) {
      response = 'Anxiety/Panic: Normal stress response. Try deep breathing (4-7-8 technique), meditation, or light exercise. Ensure good sleep and avoid caffeine. If persistent, consider speaking with a counselor or therapist. Some people benefit from cognitive behavioral therapy (CBT).';
    } else if (text.includes('headache') || text.includes('head pain')) {
      response = 'Headache: Could be caused by tension, dehydration, or stress. Rest, hydrate, and take paracetamol if needed. Apply warm/cold compress. Avoid bright lights. See a doctor if severe, persistent, or accompanied by fever/stiffness.';
    } else if (text.includes('fever') || text.includes('temperature') || text.includes('warm')) {
      response = 'Fever: Usually a sign of infection (viral or bacterial). Rest and hydration are key. Use paracetamol or ibuprofen for comfort. If temp > 39°C (103°F), or lasting >3 days, or with severe symptoms, see a doctor immediately.';
    } else if (text.includes('cough') || text.includes('cold')) {
      response = 'Cough/Cold: Usually viral and resolves in 1-2 weeks. Stay hydrated, rest, use honey or cough drops. Avoid smoking and pollutants. If dry cough persists >2 weeks, or with fever/shortness of breath, see a doctor.';
    } else if (text.includes('stomach') || text.includes('stomach pain') || text.includes('stomach ache') || text.includes('diarrhea') || text.includes('vomit')) {
      response = 'Stomach Issues: Often food-related or viral. Rest your stomach, sip water/electrolytes (not solid food initially). Avoid dairy, spicy, fatty foods. Most resolve in 24-48 hours. See doctor if: severe pain, blood in stool, lasting >3 days, or dehydration signs.';
    } else if (text.includes('dizzy') || text.includes('dizziness') || text.includes('vertigo')) {
      response = 'Dizziness: Can be caused by dehydration, low blood pressure, inner ear issues, or anxiety. Sit/lie down, stay hydrated, avoid sudden movements. Move slowly when standing. If severe, persistent, or with other symptoms, see a doctor.';
    } else if (text.includes('sleep') || text.includes('insomnia') || text.includes('tired') || text.includes('fatigue')) {
      response = 'Sleep/Fatigue Issues: Establish consistent sleep schedule, avoid screens 1 hour before bed, exercise daily, limit caffeine after 2pm. Dark, cool room helps. If persistent, consider relaxation techniques or consulting a sleep specialist.';
    } else if (text.includes('back pain') || text.includes('back ache')) {
      response = 'Back Pain: Often from poor posture or muscle strain. Gentle stretching, good posture, and heat therapy help. Avoid heavy lifting. Exercise regularly. If pain radiates down legs, severe, or lasting >1 month, see a doctor.';
    } else if (text.includes('joint') || text.includes('arthritis') || text.includes('knee') || text.includes('shoulder')) {
      response = 'Joint Pain/Arthritis: Rest the affected area, ice for acute pain, heat for chronic. Gentle movement/stretching helps. Maintain healthy weight. If swelling, redness, or severe pain, see a doctor. Physiotherapy may help.';
    } else if (text.includes('blood pressure') || text.includes('hypertension')) {
      response = 'High Blood Pressure: Monitor regularly, reduce salt intake, exercise 30 min daily, manage stress, limit alcohol. Maintain healthy weight. Consult doctor for medication if consistently high. Regular monitoring is important.';
    } else if (text.includes('diabetes')) {
      response = 'Diabetes Management: Regular blood sugar monitoring, balanced diet (low glycemic index), exercise, stress management. Take medications as prescribed. Get regular check-ups. Complications can be prevented with good control.';
    } else if (text.includes('allergy') || text.includes('allergic') || text.includes('itch')) {
      response = 'Allergy/Itching: Identify and avoid triggers. Antihistamines help. Keep skin moisturized. Avoid harsh soaps. Wear breathable clothing. If severe, rash spreads, or difficulty breathing, see a doctor immediately.';
    } else if (text.includes('sore throat') || text.includes('throat')) {
      response = 'Sore Throat: Usually viral. Gargle with salt water, use throat lozenges, drink warm liquids, rest voice. Avoid smoking/pollution. Ibuprofen helps pain. See doctor if: severe pain, pus visible, difficulty swallowing, or lasting >1 week.';
    } else {
      // Generic response for unknown symptoms
      response = `For "${symptom}": General advice - Monitor your symptoms closely. Rest adequately, stay hydrated, and maintain good hygiene. If symptoms worsen, persist >3-5 days, or you feel very unwell, consult a healthcare professional. This is general information, not medical diagnosis.`;
    }

    // Return structured response
    res.json({ ok: true, data: { symptom, response, patientId } });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

module.exports = router;
