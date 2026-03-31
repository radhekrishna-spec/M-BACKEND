const express = require('express');
const router = express.Router();

const { processFormSubmit } = require('../services/formSubmitService');

router.post('/submit', async (req, res) => {
  try {
    const result = await processFormSubmit(req.body);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
