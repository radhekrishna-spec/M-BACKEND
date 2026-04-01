const express = require('express');
const router = express.Router();
const { getSettings } = require('../services/settingsService');
const store = require('../store');
const { processFormSubmit } = require('../services/formSubmitService');
const settings = getSettings();
// health test route
router.get('/test', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Submit routes working',
  });
});

// main submit route
router.post('/submit', async (req, res) => {
  try {
    const { confession } = req.body;

    // validation
    if (!confession || !confession.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Confession text is required',
      });
    }

    const cleanText = confession.trim();

    // duplicate protection (last 10 sec same text block)
    const lastText = store.get('LAST_SUBMIT_TEXT');
    const lastTime = store.get('LAST_SUBMIT_TIME');

    if (lastText === cleanText && lastTime && Date.now() - lastTime < 10000) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate submission detected',
      });
    }

    store.set('LAST_SUBMIT_TEXT', cleanText);
    store.set('LAST_SUBMIT_TIME', Date.now());

    // exact same original flow
    const result = await processFormSubmit({
      confession: cleanText,
    });

    return res.status(200).json({
      success: true,
      message: 'Confession submitted successfully',
      result: result || null,
    });
  } catch (error) {
    console.error('SUBMIT ROUTE ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Submission failed',
    });
  }
});

module.exports = router;
