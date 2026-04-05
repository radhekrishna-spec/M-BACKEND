const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../services/settingsService');
const {
  setConfessionNo,
  getCurrentConfessionNo,
} = require('../modules/confession/services/confessionCounter');

router.get('/settings', (req, res) => {
  res.json({
    ...getSettings(),
    confessionNo: getCurrentConfessionNo(),
  });
});

router.post('/settings', (req, res) => {
  const updated = updateSettings(req.body);
  res.json({
    success: true,
    settings: updated,
  });
});

// NEW
router.post('/confession-no', (req, res) => {
  const { confessionNo } = req.body;

  if (!confessionNo) {
    return res.status(400).json({
      success: false,
      message: 'confessionNo required',
    });
  }

  const updated = setConfessionNo(confessionNo);

  res.json({
    success: true,
    confessionNo: updated,
  });
});

module.exports = router;
