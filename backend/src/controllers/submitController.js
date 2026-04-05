const { createConfession } = require('../services/submitService');
const { postNowById } = require('../services/postNowService');

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
    const result = await postNowById(req.body.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
