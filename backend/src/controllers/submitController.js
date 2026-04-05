const { createConfession } = require('../services/submitService');
const { postNowById } = require('../services/instagram/postNowService');

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
    const { id } = req.body;
    const result = await postNowById(id);

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
