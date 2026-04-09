const store = require('../store/store');
const Confession = require('../models/Confession');
const { moveFileToFolder } = require('../services//google/driveService');
const { updateTelegramButtons } = require('../services/telegramUpdateService');
const { postToInstagram } = require('../modules/social/instagramService');

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// =========================
// DYNAMIC POST HOURS
// =========================
function getPostTimes(queueCount) {
  let baseHours = [];

  if (queueCount <= 3) {
    baseHours = [9, 15, 21];
  } else if (queueCount <= 6) {
    baseHours = [9, 12, 14, 17, 20, 23];
  } else {
    baseHours = [7, 9, 11, 13, 15, 17, 19, 21, 23];
  }

  return baseHours;
}

// =========================
// RANDOM MINUTE PER HOUR
// =========================
function getRandomMinuteForHour(dateKey, hour) {
  const key = `RANDOM_MINUTE_${dateKey}_${hour}`;

  let minute = store.get(key);

  if (minute === undefined || minute === null) {
    minute = Math.floor(Math.random() * 60);
    store.set(key, minute);
  }

  return minute;
}

// =========================
// QUEUE COUNT
// =========================
async function getApprovedQueueCount() {
  return await Confession.countDocuments({
    status: 'APPROVED',
  });
}

// =========================
// MAIN TIME CHECK
// =========================
async function shouldPostNow() {
  const now = new Date(
    new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
    }),
  );

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  console.log('⏰ SCHEDULER CHECK RUNNING');
  console.log('🕒 CURRENT TIME:', now.toLocaleTimeString());

  const queueCount = await getApprovedQueueCount();

  if (!queueCount) {
    console.log('❌ No approved queue');
    return false;
  }

  let postHours = getPostTimes(queueCount);

  /*
    🔥 TESTING MODE
    Agar abhi 10 baj chuke hain aur tu chahta hai
    10–11 ke bich post ho jaye
    toh is line ko uncomment kar:

    postHours = [10];
  */

  // postHours = [10];

  if (!postHours.includes(currentHour)) {
    console.log('⏳ Current hour not matched');
    return false;
  }

  const todayKey = now.toDateString();

  const randomMinute = getRandomMinuteForHour(
    todayKey,
    currentHour,
  );

  /*
    🔥 SAFE WINDOW
    random minute ke baad 10 min tak post allowed
  */
  const allowedWindow = 10;

  if (
    currentMinute < randomMinute ||
    currentMinute > randomMinute + allowedWindow
  ) {
    console.log(
      `⏳ Waiting slot ${currentHour}:${randomMinute}`
    );
    return false;
  }

  const slotKey = `LAST_POST_SLOT_${todayKey}_${currentHour}`;

  if (store.get(slotKey)) {
    console.log('⚠️ Already posted this hour');
    return false;
  }

  store.set(slotKey, '1');

  console.log(
    `✅ Slot matched: ${currentHour}:${randomMinute}`
  );

  return true;
}

// =========================
// FIFO APPROVED CONFESSION
// =========================
async function getNextApprovedConfession() {
  return await Confession.findOne({
    status: 'APPROVED',
  }).sort({ confessionNo: 1 });
}

// =========================
// POST FLOW
// =========================
async function processApprovedQueue() {
  const confession = await getNextApprovedConfession();

  if (!confession) {
    return {
      success: false,
      message: 'No approved confession',
    };
  }

  const confessionNo = confession.confessionNo;
  const images = confession.images || [];
  const caption = confession.caption || '';

  if (!confessionNo) {
    return {
      success: false,
      message: 'No approved confession',
    };
  }

  if (!images.length) {
    await Confession.updateOne(
      { confessionNo },
      {
        status: 'FAILED',
        failureReason: 'No images found',
      },
    );

    store.set(`state_${confessionNo}`, 'FAILED');

    console.log(`❌ #${confessionNo} marked FAILED`);

    return {
      success: false,
      message: 'No images found',
    };
  }

  try {
    store.set(`posting_${confessionNo}`, '1');

    await Confession.updateOne(
      { confessionNo },
      { status: 'POSTING' },
    );

    const axios = require('axios');

    try {
      await axios.get(images[0], {
        responseType: 'arraybuffer',
        timeout: 15000,
        maxRedirects: 5,
      });
    } catch (e) {
      console.error(
        '❌ IMAGE URL TEST FAIL:',
        e.response?.data || e.message
      );
    }

    await postToInstagram(images, caption);

    const fileIds =
      store.get(`fileIds_${confessionNo}`) || [];

    for (const fileId of fileIds) {
      await moveFileToFolder(fileId, 'posted');
    }

    await Confession.updateOne(
      { confessionNo },
      {
        status: 'POSTED',
        postedTime: new Date(),
      },
    );

    store.delete(`images_${confessionNo}`);
    store.delete(`caption_${confessionNo}`);
    store.set(
      `posted_time_${confessionNo}`,
      Date.now()
    );

    const tgMsgId = store.get(
      `telegram_msg_${confessionNo}`
    );

    await updateTelegramButtons(
      CHAT_ID,
      tgMsgId,
      'posted',
      confessionNo
    );

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
      message:
        error.response?.data || error.message,
    };
  } finally {
    store.delete(`posting_${confessionNo}`);
  }
}

// =========================
// WORKER
// =========================
async function startSchedulerWorker() {
  console.log('🚀 Scheduler worker started');

  setInterval(async () => {
    console.log('🔁 Scheduler interval tick');

    try {
      const next = await getNextApprovedConfession();

      console.log(
        '📦 NEXT APPROVED:',
        next?.confessionNo
      );

      if (next && (await shouldPostNow())) {
        await processApprovedQueue();
      }
    } catch (error) {
      console.error(
        'SCHEDULER ERROR:',
        error.message
      );
    }
  }, 60000);
}

module.exports = {
  shouldPostNow,
  processApprovedQueue,
  startSchedulerWorker,
};
