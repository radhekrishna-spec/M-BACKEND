const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../services/settingsService');

router.get('/settings', (req, res) => {
  res.json(getSettings());
});

router.post('/settings', (req, res) => {
  const updated = updateSettings(req.body);
  res.json({
    success: true,
    settings: updated,
  });
});

module.exports = router;
