const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');

router.post('/submit', async (req, res) => {
  try {
    const { message } = req.body;

    const newConfession = new Confession({
      message,
    });

    await newConfession.save();

    res.status(201).json({
      success: true,
      data: newConfession,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
