const Counter = require('../models/Counter');
const Confession = require('../models/Confession');
const { processFormSubmit } = require('./formSubmitService');

async function createManualConfession(message) {
  try {
    if (!message || !message.trim()) {
      throw new Error('Confession message is required');
    }

    // unique confession number
    const counter = await Counter.findOneAndUpdate(
      { key: 'confessionNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    const confessionNo = counter.seq;

    // save in mongo
    const newConfession = new Confession({
      message: message.trim(),
      confessionNo,
      status: 'pending',
    });

    await newConfession.save();

    // trigger telegram flow + queue image generation
    await processFormSubmit({
      confession: message.trim(),
    });

    console.log(`✅ Confession #${confessionNo} sent to Telegram`);

    return {
      success: true,
      confessionNo,
      data: newConfession,
    };
  } catch (error) {
    console.error('MANUAL CONFESSION ERROR:', error);
    throw error;
  }
}

module.exports = {
  createManualConfession,
};
