const express = require('express');
const router = express.Router();

const {
  submitConfession,
  postConfessionNow,
} = require('../controllers/submitController');

router.post('/submit', submitConfession);
router.post('/post-now', postConfessionNow);

module.exports = router;
