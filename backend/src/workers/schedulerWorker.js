const store = require('../store/store');
const { postCarousel } = require('../modules/social/instagramService');
const { updateTelegramButtons } = require('../services/telegramUpdateService');

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Dynamic timing based on approved queue count
function getPostTimes(queueCount) {
  if (queueCount <= 3) {
    return [9, 13, 21];
  }

  if (queueCount <= 6) {
    return [9, 12, 15, 17, 19, 22];
  }

  if (queueCount <= 10) {
    return [9, 11, 13, 15, 17, 19, 21, 22];
  }

  return [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
}

// count approved queue
function getApprovedQueueCount() {
  const all = store.getAll() || {};
  let count = 0;

  for (const key in all) {
    if (key.startsWith('state_') && all[key] === 'APPROVED') {
      count++;
    }
  }

  return count;
}

// new time based posting logic
function shouldPostNow() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // only trigger in first 5 mins
  if (currentMinute > 5) {
    return false;
  }

  const queueCount = getApprovedQueueCount();

  if (!queueCount) {
    return false;
  }

  const postTimes = getPostTimes(queueCount);

  const lastSlotKey = `LAST_POST_SLOT_${currentHour}`;
  const todayKey = new Date().toDateString();

  const alreadyPosted = store.get(lastSlotKey);

  if (alreadyPosted === todayKey) {
    return false;
  }

  if (postTimes.includes(currentHour)) {
    store.set(lastSlotKey, todayKey);
    return true;
  }

  return false;
}

// FIFO approved confession
function getNextApprovedConfession() {
  const all = store.getAll() || {};
  const approved = [];

  for (const key in all) {
    if (key.startsWith('state_') && all[key] === 'APPROVED') {
      const id = key.replace('state_', '');
      approved.push(Number(id));
    }
  }

  if (!approved.length) {
    return null;
  }

  approved.sort((a, b) => a - b);

  return approved[0];
}

// post flow
async function processApprovedQueue() {
  const confessionNo = getNextApprovedConfession();

  if (!confessionNo) return;

  if (store.get(`posting_${confessionNo}`)) {
    return;
  }

  const images = store.get(`images_${confessionNo}`) || [];
  const caption = store.get(`caption_${confessionNo}`) || '';

  if (!images.length) {
    store.set(`state_${confessionNo}`, 'FAILED');
    return;
  }

  try {
    store.set(`posting_${confessionNo}`, '1');
    store.set(`state_${confessionNo}`, 'POSTING');

    await postCarousel(images, caption);

    store.set(`state_${confessionNo}`, 'POSTED');
    store.set(`posted_time_${confessionNo}`, Date.now());

    const tgMsgId = store.get(`telegram_msg_${confessionNo}`);

    await updateTelegramButtons(CHAT_ID, tgMsgId, 'posted', confessionNo);

    console.log(`🚀 Posted confession #${confessionNo}`);
  } catch (error) {
    console.error('POST FAIL', error.message);
    store.set(`state_${confessionNo}`, 'FAILED');
  } finally {
    store.delete(`posting_${confessionNo}`);
  }
}

// worker
function startSchedulerWorker() {
  console.log('Scheduler worker started...');

  setInterval(async () => {
    try {
      if (shouldPostNow()) {
        await processApprovedQueue();
      }
    } catch (error) {
      console.error('SCHEDULER ERROR:', error.message);
    }
  }, 60000);
}

module.exports = {
  shouldPostNow,
  processApprovedQueue,
  startSchedulerWorker,
};
