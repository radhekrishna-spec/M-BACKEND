const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const Counter = require('../models/Counter');
const {
  processFormSubmit,
} = require('../modules/confession/formSubmitService');
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
  const hour12 = selectedHour > 12 ? selectedHour - 12 : selectedHour;

  return `Around ${hour12}:00 ${suffix}`;
}

router.post('/submit', async (req, res) => {
  try {
    const { message } = req.body;

    //console.log('STEP 1 request received');

    // Persistent counter
    const counter = await Counter.findOneAndUpdate(
      { key: 'confessionNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    const confessionNo = counter.seq;

    const newConfession = new Confession({
      message,
      confessionNo,
      status: 'PENDING',
    });

    await newConfession.save();
    //console.log('STEP 2 mongo saved');

    const result = await processFormSubmit({
      confession: message,
    });

    //console.log('STEP 3 process done');

    const queueAhead = await Confession.countDocuments({
      status: 'PENDING',
      confessionNo: { $lt: confessionNo },
    });

    const eta = getEstimatedPostTime(queueAhead);

    res.status(201).json({
      success: true,
      confessionNo,
      queueAhead,
      eta,
      data: newConfession,
    });
  } catch (error) {
    console.error('ROUTE ERROR:', error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
