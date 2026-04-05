const store = require('../store/store');
const Confession = require('../models/Confession');

const { updateTelegramButtons } = require('../services/telegramUpdateService');
const { postToInstagram } = require('../modules/social/instagramService');

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
async function getApprovedQueueCount() {
  return await Confession.countDocuments({
    status: 'APPROVED',
  });
}

// new time based posting logic
async function shouldPostNow() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // only trigger in first 5 mins
  if (currentMinute > 59) {
    return false;
  }

  const queueCount = await getApprovedQueueCount();

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
async function getNextApprovedConfession() {
  return await Confession.findOne({
    status: 'APPROVED',
  }).sort({ confessionNo: 1 });
}

// post flow
async function processApprovedQueue() {
  console.log('🧾 STORE DATA:', store.getAll());

  const confession = await getNextApprovedConfession();

  console.log('🧾 NEXT APPROVED CONFESSION:', confession);

  if (!confession) {
    console.log('❌ no approved confession');
    return {
      success: false,
      message: 'No approved confession',
    };
  }

  const images = store.get(`images_${confessionNo}`) || [];
  const caption = store.get(`caption_${confessionNo}`) || '';

  console.log('🖼 images:', images);
  console.log('📝 caption:', caption);

  if (!confessionNo) {
    return {
      success: false,
      message: 'No approved confession',
    };
  }

  if (!images.length) {
    store.set(`state_${confessionNo}`, 'FAILED');
    return {
      success: false,
      message: 'No images found',
    };
  }

  try {
    store.set(`posting_${confessionNo}`, '1');
    await Confession.updateOne({ confessionNo }, { status: 'POSTING' });

    await postToInstagram(images, caption);
    await Confession.updateOne(
      { confessionNo },
      {
        status: 'POSTED',
        postedTime: new Date(),
      },
    );

    store.delete(`images_${confessionNo}`);
    store.delete(`caption_${confessionNo}`);
    store.set(`posted_time_${confessionNo}`, Date.now());

    const tgMsgId = store.get(`telegram_msg_${confessionNo}`);

    await updateTelegramButtons(CHAT_ID, tgMsgId, 'posted', confessionNo);

    console.log(`🚀 Posted confession #${confessionNo}`);
    return {
      success: true,
      confessionNo,
      message: `Confession #${confessionNo} posted successfully`,
    };
  } catch (error) {
    console.error('❌ POST FAIL FULL:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    await Confession.updateOne(
      { confessionNo },
      {
        status: 'FAILED',
        failureReason: error.message,
      },
    );

    return {
      success: false,
      confessionNo,
      message: error.response?.data || error.message,
    };
  } finally {
    store.delete(`posting_${confessionNo}`);
  }
}

// worker
async function startSchedulerWorker() {
  console.log('Scheduler worker started...');

  setInterval(async () => {
    try {
      const next = await getNextApprovedConfession();
      if (next && (await shouldPostNow())) {
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
