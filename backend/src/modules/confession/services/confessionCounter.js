const Counter = require('../../../models/Counter');

const DEFAULT_CONFESSION_NO = 1000;

async function getNextConfessionNo() {
  const counter = await Counter.findOneAndUpdate(
    { key: 'confessionNumber' },
    {
      $inc: { seq: 1 },
      $setOnInsert: { seq: DEFAULT_CONFESSION_NO },
    },
    {
      new: true,
      upsert: true,
    },
  );

  return counter.seq;
}

async function setConfessionNo(newNo) {
  await Counter.findOneAndUpdate(
    { key: 'confessionNumber' },
    { seq: Number(newNo) },
    { upsert: true },
  );

  return Number(newNo);
}

async function getCurrentConfessionNo() {
  const counter = await Counter.findOne({
    key: 'confessionNumber',
  });

  return counter?.seq || DEFAULT_CONFESSION_NO;
}

module.exports = {
  getNextConfessionNo,
  setConfessionNo,
  getCurrentConfessionNo,
};
