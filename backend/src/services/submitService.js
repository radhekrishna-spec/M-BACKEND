const Confession = require('../models/Confession');

const {
  processFormSubmit,
} = require('../modules/confession/formSubmitService');
const {
  getNextConfessionNo,
} = require('../modules/confession/services/confessionCounter');

const { getEstimatedPostTime } = require('../utils/etaHelper');

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
