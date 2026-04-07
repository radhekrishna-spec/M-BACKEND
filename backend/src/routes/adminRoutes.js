const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');

router.get('/confessions', async (req, res) => {
  try {
    const data = await Confession.find().sort({ createdAt: -1 });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
