const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const Counter = require('../models/Counter');
const { processFormSubmit } = require('../services/formSubmitService');
const store = require('../store');
const { moveFileToFolder } = require('../services/driveService');

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

// submit route
router.post('/submit', async (req, res) => {
  try {
    const { message } = req.body;

    console.log('STEP 1 request received');

    const counter = await Counter.findOneAndUpdate(
      { key: 'confessionNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    const confessionNo = counter.seq;

    const newConfession = new Confession({
      message,
      confessionNo,
      status: 'pending',
    });

    await newConfession.save();
    console.log('STEP 2 mongo saved');

    await processFormSubmit({
      confession: message,
    });

    console.log('STEP 3 process done');

    const queueAhead = await Confession.countDocuments({
      status: 'pending',
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

// immediate post route
router.post('/post-now', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'id is required',
      });
    }

    const fileIds = store.get(`fileIds_${id}`) || [];

    if (!fileIds.length) {
      return res.status(404).json({
        success: false,
        error: `No queue image found for confession #${id}`,
      });
    }

    for (const fileId of fileIds) {
      await moveFileToFolder(fileId, 'posted');
    }

    await Confession.findOneAndUpdate(
      { confessionNo: id },
      { status: 'posted' },
    );

    store.set(`state_${id}`, 'POSTED');

    return res.status(200).json({
      success: true,
      message: `Confession #${id} posted successfully`,
    });
  } catch (error) {
    console.error('POST NOW ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
