const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const Counter = require('../models/Counter');
const { processFormSubmit } = require('../services/formSubmitService');

router.post('/submit', async (req, res) => {
  try {
    const { message } = req.body;

    console.log('STEP 1 request received');

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
      status: 'pending',
    });

    await newConfession.save();
    console.log('STEP 2 mongo saved');

    const result = await processFormSubmit({
      confession: message,
    });

    console.log('STEP 3 process done');

    const queueAhead = await Confession.countDocuments({
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      confessionNo,
      queueAhead,
      estimatedPostTime: 'Today 8:30 PM',
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
