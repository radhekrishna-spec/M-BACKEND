const Confession = require('../models/Confession');
const Counter = require('../models/Counter');
const { processFormSubmit } = require('./formSubmitService');
const { getEstimatedPostTime } = require('../utils/etaHelper');
const { getNextConfessionNo } = require('./confessionCounter');

exports.createConfession = async ({ message }) => {

  const confessionNo = await getNextConfessionNo();

  const newConfession = await Confession.create({
    message,
    confessionNo,
    status: 'pending',
  });

  await processFormSubmit({
    confession: message,
  });

  const queueAhead = await Confession.countDocuments({
    status: 'pending',
    confessionNo: { $lt: confessionNo },
  });

  const eta = getEstimatedPostTime(queueAhead);

  return {
    confessionNo,
    queueAhead,
    eta,
    data: newConfession,
  };
};
