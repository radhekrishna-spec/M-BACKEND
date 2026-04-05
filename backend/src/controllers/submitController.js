const { createConfession } = require('../services/submitService');
const { postNowById } = require('../services/instagram/postNowService');
const { processApprovedQueue } = require('../workers/schedulerWorker');
const store = require('../store/store');

exports.submitConfession = async (req, res) => {
  try {
    const result = await createConfession(req.body);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.postConfessionNow = async (req, res) => {
  try {
    store.set('state_19', 'APPROVED');
    store.set('images_19', [
      'https://lh3.googleusercontent.com/d/1cj_hjaR-I41KG2hrOZUhSquCHySLtR5s',
    ]);
    store.set('caption_19', 'Confession #19');

    const result = await processApprovedQueue();

    res.status(200).json({
      success: true,
      message: result?.message || 'Next approved confession posted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
