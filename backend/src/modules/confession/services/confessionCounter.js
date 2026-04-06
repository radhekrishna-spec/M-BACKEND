const Counter = require('../../../models/Counter');
const Confession = require('../../../models/Confession');

const DEFAULT_CONFESSION_NO = 1000;

async function getNextConfessionNo() {
  let counter = await Counter.findOne({
    key: 'confessionNumber',
  });

  // First-time initialization
  if (!counter) {
    const lastConfession = await Confession.findOne().sort({
      confessionNo: -1,
    });

    const startNo = lastConfession
      ? lastConfession.confessionNo
      : DEFAULT_CONFESSION_NO;

    counter = await Counter.create({
      key: 'confessionNumber',
      seq: startNo,
    });
  }

  const updatedCounter = await Counter.findOneAndUpdate(
    { key: 'confessionNumber' },
    { $inc: { seq: 1 } },
    {
      returnDocument: 'after',
    },
  );

  return updatedCounter.seq;
}

async function setConfessionNo(newNo) {
  const updatedCounter = await Counter.findOneAndUpdate(
    { key: 'confessionNumber' },
    { $set: { seq: Number(newNo) } },
    {
      upsert: true,
      returnDocument: 'after',
    },
  );

  return updatedCounter.seq;
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
