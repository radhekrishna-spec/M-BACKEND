const express = require('express');
const router = express.Router();

const store = require('../store');
const { processFormSubmit } = require('../services/formSubmitService');


function getPostTimes(queueCount) {
  if (queueCount <= 3) return [9, 13, 21];
  if (queueCount <= 6) return [9, 12, 15, 17, 19, 22];
  if (queueCount <= 10) return [9, 11, 13, 15, 17, 19, 21, 22];

  return [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
}

function getEstimatedPostTime(queueAhead) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const slots = getPostTimes(Math.max(queueAhead + 1, 1));

  // current hour ka slot agar 5 min se nikal gaya to next slots only
  const nextSlots = slots.filter((hour) => {
    if (hour > currentHour) return true;
    if (hour === currentHour && currentMinute <= 5) return true;
    return false;
  });

  let selectedHour;

  if (queueAhead < nextSlots.length) {
    selectedHour = nextSlots[queueAhead];
  } else {
    selectedHour = slots[queueAhead % slots.length];
  }

  const suffix = selectedHour >= 12 ? 'PM' : 'AM';

  const hour12 =
    selectedHour === 0
      ? 12
      : selectedHour > 12
        ? selectedHour - 12
        : selectedHour;

  return `${hour12}:00 ${suffix}`;
}
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
    const allBefore = store.getAll() || {};

    let queueAhead = 0;

    for (const key in allBefore) {
      if (
        key.startsWith('state_') &&
        ['CREATED', 'APPROVED', 'POSTING'].includes(allBefore[key])
      ) {
        queueAhead++;
      }
    }

    const result = await processFormSubmit({
      confession: cleanText,
    });

    const eta = getEstimatedPostTime(queueAhead);

    return res.status(200).json({
      success: true,
      message: 'Confession submitted successfully',
      confessionNo: result?.confessionNo || null,
      queueAhead,
      eta,
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
