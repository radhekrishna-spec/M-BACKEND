const Confession = require('../models/Confession');

const {
  processFormSubmit,
} = require('../modules/confession/formSubmitService');

const { getEstimatedPostTime } = require('../utils/etaHelper');

exports.createConfession = async ({ message }) => {
  const result = await processFormSubmit({
    confession: message,
  });

  const confessionNo = result.confessionNo;

  const newConfession = await Confession.create({
    message,
    confessionNo,
    status: 'PENDING',
    images: result.images || [],
    caption: result.caption || '',
  });

  const queueAhead = await Confession.countDocuments({
    status: 'PENDING',
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
